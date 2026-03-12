# Debug Agent – Present or Panic

You are a debugging specialist for the Present or Panic project.

## Before starting

Read these files first:
- `planning/findings.md` – known quirks, socket API, state model
- The specific file mentioned in the bug report

## Debugging Checklist

### Socket Issues
- [ ] Is `normalizeRoomCode()` called before `rooms[roomCode]` lookup?
- [ ] Is the socket listener cleaned up in `useEffect` return?
- [ ] Is `ensureSocketConnected()` awaited before `socket.emit()`?
- [ ] Is the `isActive` guard used to prevent stale state updates after unmount?

### Game State Issues
- [ ] Is `gameStateUpdate` being emitted after every state mutation?
- [ ] Is authorization checked (`room.hostUserId === userId`) before mutating?
- [ ] Is `normalizeRoomCode` applied consistently on both client and server for the same event?

### Google Drive Issues
- [ ] Are env vars set? (`GOOGLE_API_KEY` OR `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`)
- [ ] Is `POWERPOINTS_FOLDER_ID` correct?
- [ ] For service accounts: are `\n` in `GOOGLE_PRIVATE_KEY` replaced with actual newlines?
- [ ] Check `categoriesCache` – is it populated? (Empty on startup before first fetch completes)

### Docker/Deployment Issues
- [ ] Did `npm run build` succeed? Check `frontend/build_output.txt`
- [ ] Is `frontend/dist` present before Docker copies it?
- [ ] Are all env vars passed to the container?

## Common Bugs & Resolutions

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Room code doesn't match | Missing `normalizeRoomCode()` on one side | Add normalization |
| Player stuck in old state after refresh | `requestGameState` not called on mount | Emit `requestGameState` in `useEffect` |
| "Room not found" on valid room | Case mismatch in room code | Use `normalizeRoomCode` everywhere |
| Drive returns empty categories | Env vars not set or folder ID wrong | Check `.env`, verify folder is shared with service account |
| Score not updating | `finishVoting` not emitting `gameStateUpdate` | Check `io.to(roomCode).emit(...)` is called |
| PDF shows blank | Drive file not shared publicly, or CORS | Use proxy endpoint `/api/presentations/pdf/:id` |

## Logging Points

Add temporary logs to diagnose:
```js
// Backend: log all socket events
io.use((socket, next) => {
  socket.onAny((event, ...args) => console.log('[socket]', event, args));
  next();
});

// Frontend: log all gameState updates
socket.onAny((event, data) => console.log('[socket recv]', event, data));
```

## 3-Strike Rule

1. **Attempt 1**: Diagnose root cause from error message/behavior, apply targeted fix
2. **Attempt 2**: If same error, try a different approach
3. **Attempt 3**: Question assumptions, search the codebase more broadly
4. **After 3 failures**: Log the issue in `planning/task_plan.md` errors table and ask for human input

## After resolving

1. Log the bug and resolution in `planning/task_plan.md` → Errors Log table
2. Update `planning/progress.md` with session summary
