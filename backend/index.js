require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');
const { createSocketHandlers } = require('./socketHandlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Google Drive API configuration
// Expects GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY
// or expects credentials to be passed differently. Since this runs locally/docker,
// a simple API Key could work if the folder is public, but for private folders we need a Service Account.
const setupDriveApi = () => {
  if (process.env.GOOGLE_API_KEY) {
    return google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY });
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    const jwtClient = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive.readonly']
    );
    return google.drive({ version: 'v3', auth: jwtClient });
  }
  console.warn('Google Drive credentials not configured. Please set GOOGLE_API_KEY or GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY in .env');
  return null;
};

const drive = setupDriveApi();
const ROOT_FOLDER_ID = process.env.POWERPOINTS_FOLDER_ID || '';

// Cache for Categories and Presentations
let categoriesCache = [];

// Fetch Categories and Presentations from Google Drive
const fetchPresentations = async () => {
  if (!drive || !ROOT_FOLDER_ID) {
    console.error('Drive API or ROOT_FOLDER_ID not configured properly.');
    return [];
  }
  console.log(`Fetching categories from Drive Folder ID: ${ROOT_FOLDER_ID}`);
  try {
    // 1. Fetch categories (folders inside ROOT_FOLDER_ID)
    const resCategories = await drive.files.list({
      q: `'${ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    const categoriesList = resCategories.data.files;
    const allData = [];

    // 2. Fetch presentations for each category
    for (const category of categoriesList) {
      const resPres = await drive.files.list({
        // fetch pdfs and google slides
        q: `'${category.id}' in parents and (mimeType='application/pdf' or mimeType='application/vnd.google-apps.presentation') and trashed=false`,
        fields: 'files(id, name, mimeType, webViewLink, webContentLink)',
      });

      const presentations = resPres.data.files.map(file => {
        let type = file.mimeType === 'application/pdf' ? 'pdf' : 'slide';
        let url = type === 'pdf' ? `/api/presentations/pdf/${file.id}` : file.webViewLink;

        // For google slides, we want the embed link
        if (type === 'slide' && url) {
          url = url.replace(/\/edit.*$/, '/embed?start=false&loop=false&delayms=3000');
        }

        return {
          id: file.id,
          title: file.name,
          type,
          url,
        };
      });

      allData.push({
        id: category.id,
        name: category.name,
        presentations
      });
    }

    categoriesCache = allData;
    console.log('Successfully updated categories from Google Drive');
    return allData;
  } catch (error) {
    console.error('Error fetching presentations from Drive:', error.message);
    return categoriesCache; // fallback to cache
  }
};

// Initial Fetch
if (drive && ROOT_FOLDER_ID) {
  fetchPresentations();
  // Fetch every 5 minutes
  setInterval(fetchPresentations, 5 * 60 * 1000);
}

// API Routes
app.get('/api/categories', (req, res) => {
  res.json(categoriesCache);
});

app.post('/api/refresh', async (req, res) => {
  await fetchPresentations();
  res.json({ success: true, categories: categoriesCache });
});

// Proxy PDF downloads to avoid CORS issues and authentication issues on frontend
app.get('/api/presentations/pdf/:id', async (req, res) => {
  try {
    if (!drive) return res.status(500).send('Drive API not configured');

    // We stream the file directly from Google Drive API
    const fileResponse = await drive.files.get(
      { fileId: req.params.id, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', 'application/pdf');
    fileResponse.data.pipe(res);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).send('Failed to fetch PDF');
  }
});

// Socket.io for Multiplayer
const rooms = {}; // { roomCode: { ...gameState } }

const generateRoomCode = () => {
  let roomCode;
  do {
    roomCode = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms[roomCode]);

  return roomCode;
};

const registerSocketHandlers = createSocketHandlers({
  io,
  rooms,
  generateRoomCode
});

io.on('connection', (socket) => {
  registerSocketHandlers(socket);
});

// Serve frontend build if it exists
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
