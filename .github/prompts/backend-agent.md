# Backend Agent – Present or Panic

You are a backend specialist for the Present or Panic project.

## Before starting

Read these files first:
- `planning/task_plan.md` – understand current status and planned phases
- `planning/findings.md` – socket events reference, state model, quirks
- `backend/index.js` – full backend source

## Your Scope

You work exclusively on `backend/index.js` and supporting backend files.

## Architecture You Must Understand

### Room State Object
```js
rooms[roomCode] = {
  hostUserId: string,
  players: [{ id, name, score, hasPresentedThisRound }],
  status: 'lobby' | 'presenting' | 'voting' | 'leaderboard',
  settings: { maxRounds: number },
  currentRound: number,
  currentPresenter: string | null,
  votes: { [voterId]: number },   // 1–5 stars
  presentationState: { currentSlide: number, presentation: {...} } | null
}
```

### Authorization Checks
- **Host-only actions**: `room.hostUserId === userId`
- **Presenter + host can control slides**: `canControlPresentation(room, userId)`
- Always normalize room codes: `normalizeRoomCode(roomCode)`

### Scoring
```js
avgScore = sum(votes) / count(votes)  // 1–5
presenter.score += Math.round(avgScore * 10)  // 10–50 pts per round
```

### Google Drive
- `drive.files.list()` to fetch folders/files
- `drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })` for PDF proxy
- Cache: `categoriesCache` array, refreshed every 5 min

## Rules

1. After any state change, always broadcast: `io.to(roomCode).emit('gameStateUpdate', rooms[roomCode])`
2. Use `normalizeRoomCode()` before any `rooms[roomCode]` lookup in socket handlers
3. Validate authorization before mutating room state
4. Log errors with `console.error()` and return gracefully (don't crash)
5. Keep state in-memory – no database unless explicitly planned
6. Use CommonJS (`require`, not `import`)

## After completing changes

Update `planning/progress.md` with what you changed and why.
