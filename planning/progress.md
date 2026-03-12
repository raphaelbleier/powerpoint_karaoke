---
project: Present or Panic
last_updated: 2026-03-12
---

# Progress Log

## Session: 2026-03-12 – Initial Planning Setup

### Summary
Initialized planning-with-files system. Analyzed full project codebase.

### Completed
- [x] Read and analyzed `backend/index.js` – full game logic, Drive API, all Socket.IO events
- [x] Read and analyzed all frontend components (`Home`, `HostView`, `ControllerView`, `socket.js`)
- [x] Read `Dockerfile` and `docker-compose.yml`
- [x] Read `.github/workflows/docker-publish.yml`
- [x] Created `planning/task_plan.md` – architecture overview, current status, planned phases
- [x] Created `planning/findings.md` – state model, socket API, UI states, quirks
- [x] Created `planning/progress.md` (this file)
- [x] Created `.github/copilot-instructions.md` – main Copilot agent
- [x] Created `.github/prompts/` sub-agent prompt files

### Notes
- All source files currently have uncommitted modifications (see `git status`)
- `frontend/build_output.txt` appears to be a build artifact that leaked into git tracking

---

## How to Continue in a New Session

1. Run the session-catchup script (or `git log --oneline -10` + `git diff --stat`)
2. Read `planning/task_plan.md` to orient on phases and status
3. Read `planning/findings.md` for architecture details before touching code
4. Update this file with progress as work continues
5. Mark completed items in `task_plan.md`

---

## Upcoming Work (Prioritized)
1. **Commit staged changes** – all modified files need a clean commit
2. **Timer feature** – backend: add `presentationTimer` to room state; frontend: countdown display
3. **Player disconnect cleanup** – grace-period timeout in backend (e.g. 30s after disconnect)
4. **QR code for join** – generate QR on host screen linking to the controller URL
5. **Tests** – socket event integration tests with `socket.io-mock` or similar

---

## Session: 2026-03-12 – Rebrand to Present or Panic

### Summary
Renamed old project branding references to **Present or Panic** across docs, UI, deployment examples, planning files, and the rebuilt frontend bundle.

### Completed
- [x] Updated `README.md` project title and setup examples
- [x] Updated landing page branding in `frontend/src/components/Home.jsx`
- [x] Renamed browser persistence keys in `frontend/src/socket.js`
- [x] Added migration from legacy `kapopo_*` localStorage keys to `presentOrPanic_*`
- [x] Updated `docker-compose.yml` example image/service/container naming
- [x] Updated planning and agent prompt files to the new project name

### Notes
- Legacy `kapopo_*` localStorage entries are migrated automatically on first use.
- The frontend production bundle was rebuilt successfully after the rebrand.

---

## Session: 2026-03-12 – Public README Refresh

### Summary
Expanded the README into a public-facing project overview with the current feature set, architecture, setup steps, deployment notes, and known limitations.

### Completed
- [x] Added a full feature overview grouped by gameplay, realtime, presentation, UI, and deployment
- [x] Documented the game flow and high-level architecture
- [x] Added local development setup and environment variable guidance
- [x] Added Docker and GHCR publishing notes
- [x] Documented current project limitations for public repo transparency

### Notes
- README content now reflects the implemented project state from the planning files.

---

## Session: 2026-03-12 – Public Branding & Release Cleanup

### Summary
Added brand assets to the repo, wired the logo and favicon into the web UI and README, added an MIT license, ignored the leaked build artifact, and sanitized the example environment file for public release.

### Completed
- [x] Added Present or Panic logo assets under `frontend/public/brand/`
- [x] Added `frontend/public/favicon.png` and wired it into `frontend/index.html`
- [x] Updated the Home, Host, and Controller views to use the new logo assets
- [x] Added the project logo to the README and updated the README license section
- [x] Added an MIT `LICENSE` file
- [x] Added `frontend/build_output.txt` to `.gitignore`
- [x] Cleared the example API key from `backend/.env.example`

### Notes
- The favicon is a PNG asset generated for the project and served from the frontend public directory.

---

## Session: 2026-03-12 – CI Test Gate

### Summary
Added backend unit tests for core game-state transitions and updated the GitHub Actions pipeline to run tests and a frontend build before publishing the Docker image.

### Completed
- [x] Extracted reusable room-state helpers into `backend/gameLogic.js`
- [x] Added backend unit tests in `backend/gameLogic.test.js`
- [x] Switched `backend/package.json` to use Node's built-in test runner
- [x] Added a `test` job to `.github/workflows/docker-publish.yml`
- [x] Made Docker publishing depend on a passing test/build job
- [x] Normalized room code usage in several backend socket handlers while refactoring

### Notes
- CI now runs on pull requests to `main` as well as pushes to `main`.

---

## Session: 2026-03-12 – Main Branch Ruleset & Test Folder Cleanup

### Summary
Moved backend tests into a dedicated `backend/test/` folder and added repository protection metadata for `main`, including a CODEOWNERS file and a GitHub ruleset template.

### Completed
- [x] Moved backend unit tests to `backend/test/gameLogic.test.js`
- [x] Updated the backend test script to run the `test` directory
- [x] Added `.github/CODEOWNERS` pointing to the repository owner
- [x] Added `.github/rulesets/main-branch-protection.json` with the desired branch protection policy
- [x] Added ruleset setup notes in `.github/rulesets/README.md`

### Notes
- GitHub rulesets cannot be fully enforced from repository files alone; the included template must still be applied in the repo settings.

---

## Session: 2026-03-12 – Public GHCR README Update

### Summary
Updated the README and compose example so the repository can be published publicly with a concrete GHCR pull path and direct self-hosting instructions.

### Completed
- [x] Added the real GHCR image path to the README
- [x] Added `docker pull` and `docker run` examples for the published image
- [x] Documented the GitHub Packages visibility step required for public anonymous pulls
- [x] Updated `docker-compose.yml` to use `ghcr.io/raphaelbleier/powerpoint_karaoke:latest`

### Notes
- Direct unauthenticated pulls work only after the GHCR package visibility is changed to public.

---

## Session: 2026-03-12 – Quick Start for Public Repo

### Summary
Added a top-level Quick Start section to the README and updated the GHCR instructions now that the repository and package are public.

### Completed
- [x] Added a concise Quick Start section near the top of the README
- [x] Added direct public `docker pull` / `docker run` usage guidance
- [x] Simplified the GHCR section to reflect public anonymous pulls

### Notes
- The README now better supports first-time visitors landing on the public repository.

---

## Session: 2026-03-12 – Launch-Ready README Polish

### Summary
Polished the README for launch with badges, a stronger top-of-page value proposition, clearer highlights, and more accurate release-status messaging.

### Completed
- [x] Added CI, GHCR, and license badges near the top of the README
- [x] Added a short "Why Present or Panic?" section
- [x] Added a launch-oriented highlights section
- [x] Corrected the limitations section to reflect existing backend unit tests
- [x] Clarified the current release state for public visitors

### Notes
- The README now reads more like a public product page while staying technically accurate.
