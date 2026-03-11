require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

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

io.on('connection', (socket) => {
  socket.on('createRoom', (callback) => {
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    rooms[roomCode] = {
      host: socket.id,
      players: [],
      status: 'lobby', // 'lobby', 'presenting', 'voting', 'leaderboard'
      settings: { maxRounds: 2 },
      currentRound: 1,
      currentPresenter: null,
      votes: {}, // { voterId: score }
      presentationState: null
    };
    socket.join(roomCode);
    callback({ roomCode });
  });

  socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
    if (rooms[roomCode]) {
      // Prevent joining if game already finished or maybe allow as audience
      const player = { id: socket.id, name: playerName, score: 0, hasPresentedThisRound: false };
      rooms[roomCode].players.push(player);
      socket.join(roomCode);

      io.to(roomCode).emit('gameStateUpdate', rooms[roomCode]);
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Room not found' });
    }
  });

  socket.on('updateSettings', ({ roomCode, settings }) => {
    if (rooms[roomCode] && rooms[roomCode].host === socket.id) {
      rooms[roomCode].settings = { ...rooms[roomCode].settings, ...settings };
      io.to(roomCode).emit('gameStateUpdate', rooms[roomCode]);
    }
  });

  socket.on('startPresentation', ({ roomCode, presentation, presenterId }) => {
    if (rooms[roomCode] && rooms[roomCode].host === socket.id) {
      rooms[roomCode].status = 'presenting';
      rooms[roomCode].currentPresenter = presenterId;
      rooms[roomCode].presentationState = { currentSlide: 0, presentation };

      const player = rooms[roomCode].players.find(p => p.id === presenterId);
      if (player) player.hasPresentedThisRound = true;

      io.to(roomCode).emit('gameStateUpdate', rooms[roomCode]);
    }
  });

  socket.on('startVoting', ({ roomCode }) => {
    if (rooms[roomCode] && rooms[roomCode].host === socket.id) {
      rooms[roomCode].status = 'voting';
      rooms[roomCode].votes = {};
      io.to(roomCode).emit('gameStateUpdate', rooms[roomCode]);
    }
  });

  socket.on('submitVote', ({ roomCode, score }) => {
    if (rooms[roomCode] && rooms[roomCode].status === 'voting') {
      rooms[roomCode].votes[socket.id] = score;
      io.to(roomCode).emit('gameStateUpdate', rooms[roomCode]);
    }
  });

  socket.on('finishVoting', ({ roomCode }) => {
    if (rooms[roomCode] && rooms[roomCode].host === socket.id) {
      const room = rooms[roomCode];

      // Calculate average score
      const voteValues = Object.values(room.votes);
      let avgScore = 0;
      if (voteValues.length > 0) {
        avgScore = voteValues.reduce((a, b) => a + b, 0) / voteValues.length;
      }

      // Add score to presenter
      const presenter = room.players.find(p => p.id === room.currentPresenter);
      if (presenter) {
        presenter.score += Math.round(avgScore * 10); // Scale up to look better (e.g. 1-5 stars = 10-50 points)
      }

      // Check if round is over (everyone presented)
      const allPresented = room.players.every(p => p.hasPresentedThisRound);

      if (allPresented) {
        if (room.currentRound >= room.settings.maxRounds) {
          room.status = 'leaderboard';
        } else {
          room.currentRound++;
          room.players.forEach(p => p.hasPresentedThisRound = false);
          room.status = 'lobby';
        }
      } else {
        room.status = 'lobby';
      }

      room.currentPresenter = null;
      room.presentationState = null;
      room.votes = {};

      io.to(roomCode).emit('gameStateUpdate', room);
    }
  });

  socket.on('nextSlide', ({ roomCode }) => {
    if (rooms[roomCode] && rooms[roomCode].presentationState) {
      // Only the presenter should ideally navigate, or the host. Let's just allow it globally for simplicity 
      // but in frontend we restrict the button.
      rooms[roomCode].presentationState.currentSlide++;
      io.to(roomCode).emit('gameStateUpdate', rooms[roomCode]);
    }
  });

  socket.on('prevSlide', ({ roomCode }) => {
    if (rooms[roomCode] && rooms[roomCode].presentationState) {
      rooms[roomCode].presentationState.currentSlide = Math.max(0, rooms[roomCode].presentationState.currentSlide - 1);
      io.to(roomCode).emit('gameStateUpdate', rooms[roomCode]);
    }
  });

  socket.on('disconnect', () => {
    for (const code in rooms) {
      if (rooms[code].host === socket.id) {
        io.to(code).emit('hostDisconnected');
        delete rooms[code];
      } else {
        const wasPlayer = rooms[code].players.find(p => p.id === socket.id);
        rooms[code].players = rooms[code].players.filter(p => p.id !== socket.id);

        // Remove their vote if they left
        if (rooms[code].votes[socket.id]) {
          delete rooms[code].votes[socket.id];
        }

        if (wasPlayer) {
          io.to(code).emit('gameStateUpdate', rooms[code]);
        }
      }
    }
  });
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
