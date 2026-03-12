---
project: Present or Panic
last_updated: 2026-03-12
---

# Findings

## Architecture Discoveries

### Backend State Model
Rooms are stored in a plain in-memory JS object (`const rooms = {}`). Each room:
```js
{
  hostUserId: string,
  players: [{ id, name, score, hasPresentedThisRound }],
  status: 'lobby' | 'presenting' | 'voting' | 'leaderboard',
  settings: { maxRounds: number },   // default: 2
  currentRound: number,
  currentPresenter: string | null,   // player userId
  votes: { [voterId]: score },       // 1–5
  presentationState: { currentSlide: number, presentation: {...} } | null
}
```

### Scoring Logic
- Each vote is a number 1–5 (stars).
- `avgScore = sum(votes) / count(votes)`
- `presenter.score += Math.round(avgScore * 10)` → range: 10–50 pts per round

### Drive Integration
- Root folder ID from `POWERPOINTS_FOLDER_ID` env var
- **Categories** = subfolders of root
- **Presentations** = PDFs or Google Slides files inside category folders
- PDFs are proxied through `/api/presentations/pdf/:id` to avoid CORS
- Google Slides are embedded via iframe (URL transformed to `/embed?...`)
- Cache refreshed every 5 minutes + manual via POST `/api/refresh`

### Socket Events Reference
| Event | Direction | Who emits | Purpose |
|-------|-----------|-----------|---------|
| `createRoom` | C→S | host | Creates room, gets roomCode back |
| `requestGameState` | C→S | host (on mount) | Re-syncs state after page load |
| `joinRoom` | C→S | player | Join room; host rejoining just gets `isHost: true` |
| `updateSettings` | C→S | host | Change maxRounds |
| `startPresentation` | C→S | host | Begins presenting phase |
| `startVoting` | C→S | host | Transitions to voting |
| `submitVote` | C→S | player | Cast a star rating |
| `finishVoting` | C→S | host | Tallies votes, advances state |
| `restartGame` | C→S | host | Resets room (`'recreate'` keeps settings, `'new'` resets) |
| `nextSlide` / `prevSlide` | C→S | host or presenter | Navigate slides |
| `leaveRoom` | C→S | anyone | Remove player or delete room (if host) |
| `gameStateUpdate` | S→C | server | Broadcasts full room state |
| `hostDisconnected` | S→C | server | Notifies players host left |

### Frontend Routing (inferred from components)
- `/` → `Home.jsx`
- `/host/:roomCode` → `HostView.jsx`
- `/controller/:roomCode` → `ControllerView.jsx`

### userId Persistence
- Stored in `localStorage` as `presentOrPanic_userId` (random alphanumeric string)
- Player name stored in `localStorage` as `presentOrPanic_playerName`
- Both persist across page refreshes → enables reconnection

### Branding Migration
- Frontend storage helpers migrate legacy `kapopo_*` localStorage keys to the new `presentOrPanic_*` keys on read.
- UI, docs, and deployment examples now use the project name **Present or Panic**.

### Branding Assets
- Public brand assets live under `frontend/public/brand/`.
- The app favicon is served from `frontend/public/favicon.png`.
- The README and the web UI both reference the same Present or Panic logo assets.

### Connection Pattern
- Socket is NOT auto-connected on import
- `ensureSocketConnected()` is called on-demand, returns a Promise
- This avoids unnecessary connections when landing on Home page

---

## UI / UX Findings

### HostView States
1. **Loading** – spinner while categories fetch
2. **Lobby** – left panel: categories + settings; right panel: player list with scores
3. **Presenting** – delegates to `<Slideshow />` component
4. **Voting** – shows vote count progress, host clicks "Reveal Score & Continue"
5. **Leaderboard** – podium (top 3) + full ranked list; restart buttons

### ControllerView States
1. **No gameState** – "Waiting for host..."
2. **Lobby** – "Waiting in Lobby..." + round indicator
3. **Presenting (not me)** – "Look at the screen! X is presenting"
4. **Presenting (me)** – large Prev/Next buttons to control slides
5. **Voting (presenter)** – "Relax while others vote"
6. **Voting (voter)** – 5 star-rating buttons, colored by score
7. **Voted** – "Vote Submitted! Waiting for others..."
8. **Leaderboard** – "Game Over! Look at the big screen"

---

## Known Quirks / Gotchas

1. **`normalizeRoomCode`** exists in both `socket.js` and `backend/index.js` – keep in sync.
2. Host can also control slides (`canControlPresentation` checks `hostUserId || currentPresenter`).
3. `leaveRoom` with `isHost: true` **deletes the entire room** and fires `hostDisconnected` to all players.
4. `finishVoting` can also transition back to `lobby` (mid-game) or to `leaderboard` (final round) depending on `allPresented` and `currentRound >= maxRounds`.
5. `frontend/build_output.txt` is committed to git and should be gitignored.
6. The Google Slides embed URL is derived by replacing `/edit.*$` with `/embed?...` – works for standard Drive share links.

---

## Environment Variables
```
# backend/.env (see .env.example)
GOOGLE_API_KEY=...                  # For public Drive folders
GOOGLE_SERVICE_ACCOUNT_EMAIL=...    # For private folders
GOOGLE_PRIVATE_KEY=...              # Newlines as \n
POWERPOINTS_FOLDER_ID=...           # Root Drive folder ID
PORT=8080                           # Default: 8080
```
