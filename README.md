<p align="center">
  <img src="frontend/public/brand/present-or-panic-logo.svg" alt="Present or Panic logo" width="420" />
</p>

# Present or Panic

Present or Panic is a multiplayer PowerPoint Karaoke web app for local parties, workshops, and chaotic presentation nights.

One screen runs the host view, players join on their phones, and the app pulls random presentations from Google Drive. A random player has to present a random deck, everyone else votes, and the game keeps score across multiple rounds.

## Features

### Core Gameplay
- Create rooms with 4-digit room codes
- Host screen for lobby, presentation, voting, and leaderboard phases
- Phone controller view for players joining the room
- Random presenter selection per round
- Random presentation selection from chosen Google Drive categories
- Multi-round games with configurable `maxRounds`
- End-of-game leaderboard with podium display
- Restart game with same setup or start fresh

### Real-Time Multiplayer
- Socket.IO-based live state sync
- Host rejoin detection after refresh
- Player reconnect support with persisted browser identity
- Room code normalization on client and server
- Host-only game phase control
- Presenter and host slide control support

### Presentation Handling
- Google Drive folders are treated as categories
- Supports PDF presentations
- Supports Google Slides presentations
- PDF proxy endpoint avoids common CORS problems
- Google Drive content cache refreshes automatically every 5 minutes
- Manual refresh endpoint available on the backend

### UI / Experience
- Animated React UI with Framer Motion
- Dedicated host and controller interfaces
- Voting flow with 1–5 star scoring
- Score calculation based on average vote × 10
- Responsive phone-first controller experience

### Deployment
- Docker multi-stage build
- `docker-compose.yml` for self-hosting
- GitHub Actions workflow for publishing to GHCR
- Works well for LAN / same-network play

## How the Game Works

1. The host creates a room on the main screen.
2. Players join the room from their phones using the 4-digit code.
3. The host selects one or more presentation categories from Google Drive.
4. The app randomly chooses a player and a presentation.
5. The selected player presents while controlling slides from their phone.
6. The rest of the group votes from 1 to 5 stars.
7. Scores are tallied and the next round begins.
8. After the configured number of rounds, the final leaderboard is shown.

## Architecture

### Stack
- Frontend: React, Vite, React Router, Framer Motion, Lucide React
- Backend: Node.js, Express, Socket.IO, Google APIs
- Content source: Google Drive
- Deployment: Docker + GitHub Container Registry

### Project Structure
```text
backend/
  index.js              # Express API, Google Drive integration, Socket.IO game logic

frontend/src/
  socket.js             # socket singleton, room normalization, persisted identity
  components/
    Home.jsx            # landing page / room creation / join
    HostView.jsx        # host screen for all game phases
    ControllerView.jsx  # player phone controller
    Slideshow.jsx       # presentation display

planning/
  task_plan.md
  findings.md
  progress.md
```

## Google Drive Setup

The backend reads presentations from a single root Google Drive folder.

- Each subfolder becomes a category
- PDFs and Google Slides files inside those folders become playable presentations

Example:

```text
Present or Panic
├── Startups/
│   ├── pitch-deck.pdf
│   └── quarterly-strategy.google-slides
└── Fun/
    └── vacation-photos.pdf
```

### Access Options

#### Option A: Public Google Drive Folder + API Key
Use this if the folder is shared as “anyone with the link can view”.

Required:
- `GOOGLE_API_KEY`
- `POWERPOINTS_FOLDER_ID`

#### Option B: Private Google Drive Folder + Service Account
Use this if the folder must stay private.

Required:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `POWERPOINTS_FOLDER_ID`

You must also share the Google Drive folder with the service account email address.

## Environment Variables

Set these in `backend/.env` or in your container environment:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port, defaults to `8080` |
| `POWERPOINTS_FOLDER_ID` | Yes | Google Drive root folder ID |
| `GOOGLE_API_KEY` | Optional* | For public Drive folders |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Optional* | For private Drive folders |
| `GOOGLE_PRIVATE_KEY` | Optional* | Private key for the service account |

`*` Use either `GOOGLE_API_KEY` or the service-account pair.

## Local Development

### Prerequisites
- Node.js 18+
- A Google Drive folder with presentations

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure backend environment

Create `backend/.env` and set at least:

```env
PORT=8080
POWERPOINTS_FOLDER_ID=your-folder-id
GOOGLE_API_KEY=your-api-key
```

Or use the service-account variables instead of `GOOGLE_API_KEY`.

### 3. Start the backend

```bash
cd backend
npm run dev
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
```

### 5. Open the app

- Host view: `http://localhost:5173`
- Backend API: `http://localhost:8080`

## Docker / Self-Hosting

### Docker Compose

Update the image and environment values in `docker-compose.yml`, then run:

```bash
docker-compose up -d
```

### GitHub Container Registry

The repository includes `.github/workflows/docker-publish.yml`.

On every push to `main`, GitHub Actions builds the Docker image and publishes it to:

```text
ghcr.io/<owner>/<repo>:latest
```

## Current Limitations

These are known limitations in the current version:

- Room state is stored in memory only; a server restart removes active rooms
- Disconnect cleanup is intentionally permissive for refresh tolerance, so stale players may remain in a room
- No presentation timer yet
- No spectator mode yet
- No automated unit or integration test suite yet

## Status

This project is already playable and covers the full core loop:

- lobby
- presentation
- voting
- score tallying
- leaderboard
- replay / new game

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
