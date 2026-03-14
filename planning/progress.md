---
project: Present or Panic
last_updated: 2026-03-14
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

---

## Session: 2026-03-12 – README Future Features

### Summary
Added a dedicated future-features section to the README so public visitors can quickly understand the planned roadmap beyond the currently shipped feature set.

### Completed
- [x] Added a roadmap-style future features section to `README.md`
- [x] Grouped planned work into gameplay, stability, and quality themes

### Notes
- The roadmap mirrors the planned phases already tracked in `planning/task_plan.md`.

---

## Session: 2026-03-12 – CI Test Script Compatibility Fix

### Summary
Fixed the backend test script so GitHub Actions on Linux can discover tests correctly without depending on shell-specific glob expansion.

### Completed
- [x] Switched `backend/package.json` test script back to `node --test`
- [x] Kept tests in `backend/test/` so Node auto-discovers them cleanly
- [x] Removed the duplicate legacy `backend/gameLogic.test.js` file

### Notes
- This avoids the `test/**/*.test.js` glob issue that failed in Linux CI.

---

## Session: 2026-03-12 – QR Join and README Roadmap

### Summary
Added a QR-based fast-join flow to the host lobby and converted the README future-features list into a clearer public roadmap with status buckets.

### Completed
- [x] Added a host-lobby QR code linking directly to the controller join URL
- [x] Added a copyable join link and localhost/LAN warning to the host UI
- [x] Replaced the README future-features section with a `Current / In Progress / Planned / Future` roadmap
- [x] Updated planning files to reflect the shipped QR join feature

### Notes
- The QR code uses the current browser origin, so hosts should open the app on their LAN IP instead of `localhost` when players join from separate phones on the same network.

---

## Session: 2026-03-12 – QR Join Flow Fix

### Summary
Adjusted the QR join path so phones land on the standard join form with the room code prefilled, and fixed the host-side initial room-state sync so the QR card appears without needing a manual page refresh.

### Completed
- [x] Changed the QR target link from the controller route to the home join screen with a prefilled room code
- [x] Prefilled the Home join form from the `roomCode` query string and the stored player name
- [x] Returned initial room state in the `requestGameState` callback so HostView can render immediately on first load

### Notes
- This keeps the controller route focused on connected/rejoining players while preserving the existing name-entry UX for first-time QR joins.

---

## Session: 2026-03-14 – Mobile Voting + Reconnect + CI Smoke Test Expansion

### Summary
Fixed mobile review/voting layout on phone controllers, resolved controller state-sync behavior that required manual refresh during review/voting, ran local smoke checks, fixed a frontend lint issue in Home query-prefill logic, and expanded GitHub Actions smoke checks.

### Completed
- [x] Updated `frontend/src/components/ControllerView.jsx` voting UI structure to use explicit mobile voting layout wrappers
- [x] Updated `frontend/src/index.css` with dedicated voting layout classes (`vote-screen`, `vote-options`, `vote-option-btn`, `vote-stars`)
- [x] Added controller-side `requestGameState` emit immediately after `joinRoom` success
- [x] Added controller reconnect handling on socket `connect` to rejoin/re-sync automatically
- [x] Ran backend tests (`npm --prefix backend test`) successfully
- [x] Ran frontend build (`npm --prefix frontend run build`) successfully
- [x] Detected lint failure in `Home.jsx` (`react-hooks/set-state-in-effect`) and fixed it
- [x] Removed effect-based roomCode prefill in `Home.jsx`; retained query-prefill via initial state
- [x] Verified frontend lint passes (`npm --prefix frontend run lint`)
- [x] Updated `.github/workflows/docker-publish.yml` to run frontend lint in CI smoke tests
- [x] Renamed workflow validation job from `test` to `smoke-tests` and kept Docker publish gated on it

### Notes
- The mobile voting buttons now remain vertically stacked on phone-sized viewports.
- Controller clients now receive current room state on join/reconnect without requiring manual page refresh.
- CI now validates backend tests + frontend lint + frontend build before image publish on `main` pushes.

---

## Session: 2026-03-14 – Host Tablet + Smartphone UX Improvements

### Summary
Improved responsive behavior so the host experience scales better on larger desktop/tablet screens and joining/voting works more consistently across different smartphone form factors and keyboards.

### Completed
- [x] Updated host container and main dashboard grid sizing for wider screens
- [x] Added large-screen (`min-width: 1366px`) spacing and category-card scaling for host UI
- [x] Updated controller viewport sizing to use `100dvh`/`100svh`
- [x] Added safe-area inset padding for phones with notches/home-indicator areas
- [x] Tuned controller control-button minimum sizes and typography with responsive clamps
- [x] Kept voting options bounded with adaptive widths for diverse mobile widths
- [x] Added mobile input hints in Home join form (`inputMode`, `enterKeyHint`, autocomplete, max name length)
- [x] Updated frontend viewport meta to include `viewport-fit=cover`
- [x] Re-ran frontend lint and production build successfully

### Notes
- These updates are CSS/UX focused; socket/game state flow was unchanged.
- Join flow is now more ergonomic on mobile keyboards while preserving existing room-code normalization.

---

## Session: 2026-03-14 – Implemented Planned Roadmap Features

### Summary
Implemented all items that were listed in the README `Planned` section: presentation timer, disconnect grace cleanup, stronger name validation, socket-flow integration tests, and frontend error boundary handling. Updated README roadmap to introduce a new future-facing planned set.

### Completed
- [x] Added backend presentation timer support with automatic transition from `presenting` to `voting`
- [x] Added host-configurable `presentationSeconds` setting and surfaced countdown in host + controller UI
- [x] Added disconnect grace cleanup with reconnect cancellation logic (`DISCONNECT_GRACE_MS`)
- [x] Added stronger player-name sanitization/validation on client and server
- [x] Added vote validation guards (score range and presenter self-vote rejection)
- [x] Extracted socket event handling into `backend/socketHandlers.js` for maintainability and testability
- [x] Added backend socket-flow integration tests in `backend/test/socketFlow.integration.test.js`
- [x] Added frontend `ErrorBoundary` wrapper and fallback UI
- [x] Updated README feature list, limitations, roadmap, and status check naming (`smoke-tests`)
- [x] Updated planning files (`task_plan.md`, `findings.md`, `progress.md`) to reflect shipped functionality

### Validation
- [x] `npm --prefix backend test`
- [x] `npm --prefix frontend run lint`
- [x] `npm --prefix frontend run build`

### Notes
- Timer settings are clamped on the server (15–600 seconds) to prevent extreme values.
- Disconnect cleanup is still in-memory and will reset on backend restart.

---

## Session: 2026-03-14 – CI Required-Check Compatibility Fix

### Summary
Fixed PR pipelines that were waiting indefinitely for a required status context that no longer existed after renaming the main test job.

### Completed
- [x] Added a compatibility status job `testExpected` in `.github/workflows/docker-publish.yml`
- [x] Kept compatibility job dependent on `smoke-tests` so it only passes when smoke checks pass
- [x] Updated `.github/rulesets/main-branch-protection.json` to use `smoke-tests` as the intended required check context
- [x] Updated `.github/rulesets/README.md` with migration guidance and temporary compatibility notes

### Notes
- Repository rules configured in GitHub UI are authoritative; the compatibility job prevents merge blocking while those rules are updated.
