---
project: Present or Panic
last_updated: 2026-03-12
---

# Task Plan

## Project Goal
Present or Panic is a multiplayer PowerPoint Karaoke web app. The **host** runs on a TV/laptop and manages the game; **players** join via their phones. Presentations are pulled from Google Drive. The app is Dockerized and published to GHCR via GitHub Actions.

---

## Architecture Overview

```
Browser (Host)          Browser (Player Phone)
   └─ HostView.jsx            └─ ControllerView.jsx
         │                           │
         └──────────────┬────────────┘
                        │  Socket.IO (real-time)
                   backend/index.js  (Express + Socket.IO)
                        │
                   Google Drive API
                   (categories → folders, presentations → PDFs / Google Slides)
```

**Game States (backend `room.status`):**
| State | Description |
|-------|-------------|
| `lobby` | Waiting; host chooses categories and starts a round |
| `presenting` | A random player is presenting a random slide |
| `voting` | Other players rate the presenter (1–5 stars → ×10 pts) |
| `leaderboard` | Final scores; host can replay or start new game |

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Framer Motion, Lucide Icons |
| Backend | Node.js, Express, Socket.IO, googleapis |
| Auth | Google Service Account JWT **or** API Key (public folder) |
| Deployment | Docker (multi-stage build), GitHub Actions → GHCR |
| Config | `.env` / env vars (see `backend/.env.example`) |

---

## Key Files
| File | Purpose |
|------|---------|
| `backend/index.js` | Full backend: Drive API, REST routes, all Socket.IO events |
| `frontend/src/socket.js` | Socket singleton, userId/name persistence, helpers |
| `frontend/src/components/Home.jsx` | Landing page – create/join room |
| `frontend/src/components/HostView.jsx` | Host UI (lobby, voting, leaderboard) |
| `frontend/src/components/ControllerView.jsx` | Player phone UI |
| `frontend/src/components/Slideshow.jsx` | Slide renderer (iframe for Slides, PDF viewer for PDF) |
| `Dockerfile` | Multi-stage: builds frontend, runs backend on port 8080 |
| `docker-compose.yml` | Local dev compose |
| `.github/workflows/docker-publish.yml` | Push to `ghcr.io` on main |

---

## Current Status (as of 2026-03-12)

### Implemented & Working
- [x] Rebrand project copy to **Present or Panic**
- [x] Added project logo assets, favicon, and MIT license for public release
- [x] Public-facing README documents features, setup, deployment, and limitations
- [x] Room creation + 4-digit codes
- [x] Player join / reconnect / host-rejoin detection
- [x] Google Drive integration (folders = categories, PDFs + Google Slides)
- [x] 5-minute Drive cache + manual refresh
- [x] PDF proxy endpoint (avoids CORS)
- [x] Random presenter + random presentation selection
- [x] Slide navigation (host + presenter can control)
- [x] Voting phase (star rating)
- [x] Score tallying (avg stars × 10 pts)
- [x] Multi-round support (`maxRounds` setting)
- [x] Leaderboard + podium UI
- [x] Game restart (replay same setup / new game)
- [x] Docker multi-stage build
- [x] GHCR publish via GitHub Actions
- [x] Framer Motion animations throughout

### Pending / Known Issues
- [ ] **Staged but uncommitted changes** – all modified files need review + commit
- [ ] No persistent storage – rooms are in-memory only (server restart = all rooms lost)
- [ ] Socket disconnect does not clean up player from room (intentional for refresh tolerance, but long-term players never removed)
- [ ] No time limit per presentation
- [ ] No spectator mode
- [ ] No unit/integration tests

---

## Planned Phases

### Phase 1 – Housekeeping (Immediate)
- [ ] Review & commit all staged changes
- [x] Add `frontend/build_output.txt` to `.gitignore`
- [ ] Verify `backend/.env.example` is complete and accurate

### Phase 2 – Stability
- [ ] Add timer per presentation (configurable, e.g. 2 min)
- [ ] Player disconnect cleanup with a grace-period timeout
- [ ] Input sanitization on player names (prevent XSS)

### Phase 3 – Features
- [ ] Spectator mode (join as viewer only, no voting weight)
- [ ] Custom scoring: allow host to set star multiplier
- [ ] Category weights (some categories appear more often)
- [ ] QR code on host screen for easy player joining

### Phase 4 – Quality
- [ ] Unit tests for backend socket logic
- [ ] E2E test with Playwright
- [ ] Error boundary in React frontend
- [ ] Better empty-state handling (no Drive credentials configured)

---

## Errors Log
| Error | Phase | Resolution |
|-------|-------|------------|
| (none logged yet) | – | – |
