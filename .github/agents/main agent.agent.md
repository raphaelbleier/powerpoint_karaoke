---
description: 'Describe what this custom agent does and when to use it.'
tools: ['vscode', 'execute', 'read', 'edit', 'search', 'web', 'agent', 'gitkraken/*', 'ms-azuretools.vscode-containers/containerToolsConfig', 'ms-python.python/getPythonEnvironmentInfo', 'ms-python.python/getPythonExecutableCommand', 'ms-python.python/installPythonPackage', 'ms-python.python/configurePythonEnvironment', 'todo']
---
# GitHub Copilot Agent – Present or Panic

You are an AI assistant helping develop **Present or Panic**, a multiplayer PowerPoint Karaoke web app.

---

## Planning-with-Files Protocol

**ALWAYS start by reading the planning files before making any changes:**

1. `planning/task_plan.md` – current phases, architecture, known issues
2. `planning/findings.md` – state model, socket API reference, quirks
3. `planning/progress.md` – session log, what was done last

**After completing work:**
- Mark completed tasks in `task_plan.md`
- Log new discoveries in `findings.md`
- Append a summary to `progress.md` with today's date

---

## Project Overview

| | |
|---|---|
| **App** | Multiplayer PowerPoint Karaoke – host on TV, players on phones |
| **Backend** | Node.js + Express + Socket.IO (`backend/index.js`) |
| **Frontend** | React 18 + Vite + React Router (`frontend/src/`) |
| **Slides source** | Google Drive (folders = categories, PDFs/Google Slides) |
| **Deployment** | Docker → GHCR via GitHub Actions |

### Game Flow
```
Host creates room → Players join with phone → Host picks categories
→ Random player + random slide assigned → Player presents (phone controls slides)
→ Voting phase (1–5 stars) → Scores tallied → Repeat for maxRounds rounds
→ Final leaderboard
```

### Room State Machine
```
lobby ──startPresentation──> presenting ──startVoting──> voting ──finishVoting──> lobby (or leaderboard)
```

---

## Coding Conventions

- **Backend**: CommonJS (`require`/`module.exports`), async/await for Drive API calls
- **Frontend**: ES Modules, functional React components with hooks, Tailwind-style class names
- **Naming**: camelCase throughout; room codes are always UPPERCASE 4-digit numbers
- **Socket events**: always pass `{ roomCode, userId, ...payload }`; roomCode must be normalized before use via `normalizeRoomCode()`
- **No TypeScript** – plain JavaScript only
- **No new dependencies** without discussing in planning files first

---

## Critical Rules

1. **Never modify game state directly on the client** – all state changes go through socket events
2. **Always normalize roomCode** before using: `normalizeRoomCode(roomCode)` (defined in `socket.js` and `backend/index.js`)
3. **Host authority**: only the host (matching `room.hostUserId`) can advance game phases; presenters can only control slides
4. **In-memory state**: rooms live in `const rooms = {}` – server restart loses all rooms; do not introduce persistence without a plan
5. **Google Drive is read-only**: the app only fetches from Drive, never writes

---

## Available Sub-Agents

Use these prompt files for specialized tasks:

| Task | Prompt File |
|------|-------------|
| Backend / Socket.IO changes | `.github/prompts/backend-agent.md` |
| Frontend / React component changes | `.github/prompts/frontend-agent.md` |
| Docker / CI/CD / deployment | `.github/prompts/devops-agent.md` |
| New feature design | `.github/prompts/feature-design-agent.md` |
| Bug investigation | `.github/prompts/debug-agent.md` |

To use a sub-agent in VS Code Copilot Chat, type:
```
#file:.github/prompts/backend-agent.md  <your task description>
```

---

## Key Files Reference

```
backend/
  index.js              ← ALL backend logic (Drive API + Socket.IO)
  .env.example          ← Required env vars

frontend/src/
  socket.js             ← Socket singleton + userId/playerName helpers
  components/
    Home.jsx            ← Landing page
    HostView.jsx        ← Host UI (all game phases)
    ControllerView.jsx  ← Player phone UI
    Slideshow.jsx       ← Slide renderer (iframe + PDF)

planning/
  task_plan.md          ← Phases, current status, architecture
  findings.md           ← Research, socket API, discoveries
  progress.md           ← Session log

.github/
  workflows/
    docker-publish.yml  ← Build + push to GHCR on main push
  prompts/              ← Sub-agent prompt files
```
