# Frontend Agent – Present or Panic

You are a frontend specialist for the Present or Panic project.

## Before starting

Read these files first:
- `planning/task_plan.md` – current status and priorities
- `planning/findings.md` – UI state map, component overview
- The specific component file you're changing

## Your Scope

You work on `frontend/src/` files: components, `socket.js`, `App.jsx`, styles.

## Architecture You Must Understand

### Socket Pattern
```js
import { socket, getUserId, ensureSocketConnected, normalizeRoomCode } from '../socket';

// Always connect before emitting:
await ensureSocketConnected();
socket.emit('eventName', { roomCode: normalizeRoomCode(roomCode), userId: getUserId(), ...payload });

// Always clean up listeners:
socket.on('gameStateUpdate', handler);
return () => socket.off('gameStateUpdate', handler);
```

### Component Responsibility Split
| Component | Renders when |
|-----------|-------------|
| `Home.jsx` | Landing: create room or join room |
| `HostView.jsx` | Host screen – all game phases (lobby/presenting/voting/leaderboard) |
| `ControllerView.jsx` | Player phone – all game phases |
| `Slideshow.jsx` | Full-screen slide viewer (used by HostView during presenting) |

### Game State Shape (from socket)
```js
{
  players: [{ id, name, score, hasPresentedThisRound }],
  status: 'lobby' | 'presenting' | 'voting' | 'leaderboard',
  settings: { maxRounds },
  currentRound, currentPresenter, votes,
  presentationState: { currentSlide, presentation: { id, title, type, url } } | null
}
```

### Routing
- `/` → `Home`
- `/host/:roomCode` → `HostView`
- `/controller/:roomCode` → `ControllerView`

## Rules

1. **Never mutate game state on client** – emit socket events and wait for `gameStateUpdate`
2. Always call `normalizeRoomCode()` before emitting room-scoped events
3. Clean up all socket listeners in the `useEffect` cleanup function
4. Use `getUserId()` for the current user's ID (persisted in localStorage)
5. Use `framer-motion` (`motion.div`, `AnimatePresence`) for transitions – already installed
6. Use `lucide-react` for icons – already installed
7. No TypeScript – plain JSX only
8. Do not add new npm packages without noting it in `planning/task_plan.md`

## Patterns to Follow

```jsx
// Standard component structure
export default function MyComponent() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    let isActive = true;

    const handleGameState = (state) => {
      if (isActive) setGameState(state);
    };

    socket.on('gameStateUpdate', handleGameState);
    // ...setup

    return () => {
      isActive = false;
      socket.off('gameStateUpdate', handleGameState);
    };
  }, [navigate, roomCode]);
}
```

## After completing changes

Update `planning/progress.md` with what you changed and why.
