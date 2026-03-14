const {
  DEFAULT_SETTINGS,
  normalizeRoomCode,
  canControlPresentation,
  resetRoomForNextGame,
  finalizeVoting
} = require('./gameLogic');

const DISCONNECT_GRACE_MS = Number(process.env.DISCONNECT_GRACE_MS) || 30000;

const sanitizePlayerName = (value = '') => {
  const raw = typeof value === 'string' ? value : '';
  return raw
    .replace(/[\u0000-\u001F\u007F<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const isValidPlayerName = (name) => {
  if (!name) return false;
  if (name.length < 2 || name.length > 24) return false;
  return /^[\p{L}\p{N} .,'_-]+$/u.test(name);
};

const normalizePresentationSeconds = (value) => {
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) {
    return DEFAULT_SETTINGS.presentationSeconds;
  }

  return Math.max(15, Math.min(600, Math.round(seconds)));
};

const createSocketHandlers = ({ io, rooms, generateRoomCode, disconnectGraceMs = DISCONNECT_GRACE_MS }) => {
  const presentationTimers = new Map();
  const disconnectTimers = new Map();
  const connectionKeysBySocketId = new Map();
  const socketIdsByConnectionKey = new Map();

  const makeConnectionKey = (roomCode, userId) => `${roomCode}:${userId}`;

  const emitGameState = (roomCode) => {
    if (!rooms[roomCode]) {
      return;
    }

    io.to(roomCode).emit('gameStateUpdate', rooms[roomCode]);
  };

  const clearPresentationTimer = (roomCode) => {
    const timer = presentationTimers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      presentationTimers.delete(roomCode);
    }
  };

  const clearDisconnectTimer = (connectionKey) => {
    const timer = disconnectTimers.get(connectionKey);
    if (timer) {
      clearTimeout(timer);
      disconnectTimers.delete(connectionKey);
    }
  };

  const clearAllRoomDisconnectTimers = (roomCode) => {
    const prefix = `${roomCode}:`;
    for (const [connectionKey, timer] of disconnectTimers.entries()) {
      if (connectionKey.startsWith(prefix)) {
        clearTimeout(timer);
        disconnectTimers.delete(connectionKey);
      }
    }
  };

  const removeSocketConnection = (socketId) => {
    const connectionKey = connectionKeysBySocketId.get(socketId);
    if (!connectionKey) {
      return null;
    }

    connectionKeysBySocketId.delete(socketId);
    const socketIds = socketIdsByConnectionKey.get(connectionKey);
    if (socketIds) {
      socketIds.delete(socketId);
      if (socketIds.size === 0) {
        socketIdsByConnectionKey.delete(connectionKey);
      }
    }

    const separatorIndex = connectionKey.indexOf(':');
    const roomCode = connectionKey.slice(0, separatorIndex);
    const userId = connectionKey.slice(separatorIndex + 1);
    return { connectionKey, roomCode, userId };
  };

  const registerSocketConnection = (socket, roomCode, userId) => {
    removeSocketConnection(socket.id);

    const connectionKey = makeConnectionKey(roomCode, userId);
    connectionKeysBySocketId.set(socket.id, connectionKey);

    const socketIds = socketIdsByConnectionKey.get(connectionKey) || new Set();
    socketIds.add(socket.id);
    socketIdsByConnectionKey.set(connectionKey, socketIds);

    clearDisconnectTimer(connectionKey);
  };

  const hasActiveConnection = (connectionKey) => {
    const socketIds = socketIdsByConnectionKey.get(connectionKey);
    return Boolean(socketIds && socketIds.size > 0);
  };

  const startVoting = (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'presenting') {
      return;
    }

    clearPresentationTimer(roomCode);
    room.status = 'voting';
    room.votes = {};
    room.presentationEndsAt = null;
    emitGameState(roomCode);
  };

  const schedulePresentationTimer = (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'presenting') {
      return;
    }

    clearPresentationTimer(roomCode);
    const durationMs = Number(room.settings.presentationSeconds) * 1000;

    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      startVoting(roomCode);
      return;
    }

    room.presentationEndsAt = Date.now() + durationMs;
    const timer = setTimeout(() => {
      const activeRoom = rooms[roomCode];
      if (!activeRoom || activeRoom.status !== 'presenting') {
        return;
      }

      startVoting(roomCode);
    }, durationMs);

    presentationTimers.set(roomCode, timer);
  };

  return (socket) => {
    socket.on('createRoom', ({ userId }, callback = () => {}) => {
      const roomCode = generateRoomCode();
      rooms[roomCode] = {
        hostUserId: userId,
        players: [],
        status: 'lobby',
        settings: { ...DEFAULT_SETTINGS },
        currentRound: 1,
        currentPresenter: null,
        votes: {},
        presentationState: null,
        presentationEndsAt: null
      };

      socket.join(roomCode);
      registerSocketConnection(socket, roomCode, userId);
      callback({ roomCode });
      emitGameState(roomCode);
    });

    socket.on('requestGameState', ({ roomCode, userId }, callback = () => {}) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];

      if (!room) {
        callback({ success: false, message: 'Room not found' });
        return;
      }

      socket.join(normalizedRoomCode);
      registerSocketConnection(socket, normalizedRoomCode, userId);
      socket.emit('gameStateUpdate', room);
      callback({ success: true, gameState: room });
    });

    socket.on('joinRoom', ({ roomCode, playerName, userId }, callback = () => {}) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];
      const sanitizedPlayerName = sanitizePlayerName(playerName);

      if (!normalizedRoomCode) {
        callback({ success: false, message: 'Invalid room code' });
        return;
      }

      if (!room) {
        callback({ success: false, message: 'Room not found' });
        return;
      }

      if (!isValidPlayerName(sanitizedPlayerName)) {
        callback({
          success: false,
          message: 'Player name must be 2-24 characters and can only contain letters, numbers, spaces, and . , \" \u0027 _ -'
        });
        return;
      }

      socket.join(normalizedRoomCode);
      registerSocketConnection(socket, normalizedRoomCode, userId);

      if (room.hostUserId === userId) {
        callback({ success: true, isHost: true });
        return;
      }

      const existingPlayer = room.players.find((player) => player.id === userId);
      if (existingPlayer) {
        existingPlayer.name = sanitizedPlayerName;
      } else {
        room.players.push({
          id: userId,
          name: sanitizedPlayerName,
          score: 0,
          hasPresentedThisRound: false
        });
      }

      emitGameState(normalizedRoomCode);
      callback({ success: true, isHost: false, playerName: sanitizedPlayerName });
    });

    socket.on('updateSettings', ({ roomCode, userId, settings }) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];

      if (!room || room.hostUserId !== userId) {
        return;
      }

      const nextSettings = {
        ...room.settings
      };

      if (settings && Object.prototype.hasOwnProperty.call(settings, 'maxRounds')) {
        const rounds = Number(settings.maxRounds);
        if (Number.isFinite(rounds)) {
          nextSettings.maxRounds = Math.max(1, Math.min(10, Math.round(rounds)));
        }
      }

      if (settings && Object.prototype.hasOwnProperty.call(settings, 'presentationSeconds')) {
        nextSettings.presentationSeconds = normalizePresentationSeconds(settings.presentationSeconds);
      }

      room.settings = nextSettings;
      emitGameState(normalizedRoomCode);
    });

    socket.on('startPresentation', ({ roomCode, userId, presentation, presenterId }) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];

      if (!room || room.hostUserId !== userId) {
        return;
      }

      room.status = 'presenting';
      room.currentPresenter = presenterId;
      room.presentationState = { currentSlide: 0, presentation };
      room.votes = {};

      const player = room.players.find((candidate) => candidate.id === presenterId);
      if (player) {
        player.hasPresentedThisRound = true;
      }

      schedulePresentationTimer(normalizedRoomCode);
      emitGameState(normalizedRoomCode);
    });

    socket.on('startVoting', ({ roomCode, userId }) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];

      if (!room || room.hostUserId !== userId) {
        return;
      }

      startVoting(normalizedRoomCode);
    });

    socket.on('submitVote', ({ roomCode, userId, score }) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];
      const numericScore = Number(score);

      if (!room || room.status !== 'voting') {
        return;
      }

      if (userId === room.currentPresenter) {
        return;
      }

      if (!Number.isFinite(numericScore) || numericScore < 1 || numericScore > 5) {
        return;
      }

      room.votes[userId] = Math.round(numericScore);
      emitGameState(normalizedRoomCode);
    });

    socket.on('finishVoting', ({ roomCode, userId }) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];

      if (!room || room.hostUserId !== userId) {
        return;
      }

      clearPresentationTimer(normalizedRoomCode);
      room.presentationEndsAt = null;
      finalizeVoting(room);
      emitGameState(normalizedRoomCode);
    });

    socket.on('restartGame', ({ roomCode, userId, mode }) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];

      if (!room || room.hostUserId !== userId) {
        return;
      }

      clearPresentationTimer(normalizedRoomCode);
      resetRoomForNextGame(room, { resetSettings: mode === 'new' });
      emitGameState(normalizedRoomCode);
    });

    socket.on('nextSlide', ({ roomCode, userId }) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];

      if (!canControlPresentation(room, userId)) {
        return;
      }

      room.presentationState.currentSlide += 1;
      emitGameState(normalizedRoomCode);
    });

    socket.on('prevSlide', ({ roomCode, userId }) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];

      if (!canControlPresentation(room, userId)) {
        return;
      }

      room.presentationState.currentSlide = Math.max(0, room.presentationState.currentSlide - 1);
      emitGameState(normalizedRoomCode);
    });

    socket.on('leaveRoom', ({ roomCode, userId, isHost }) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms[normalizedRoomCode];

      clearDisconnectTimer(makeConnectionKey(normalizedRoomCode, userId));
      removeSocketConnection(socket.id);

      if (!room) {
        return;
      }

      if (isHost && room.hostUserId === userId) {
        clearPresentationTimer(normalizedRoomCode);
        clearAllRoomDisconnectTimers(normalizedRoomCode);
        io.to(normalizedRoomCode).emit('hostDisconnected');
        delete rooms[normalizedRoomCode];
        return;
      }

      room.players = room.players.filter((player) => player.id !== userId);
      delete room.votes[userId];
      emitGameState(normalizedRoomCode);
    });

    socket.on('disconnect', () => {
      const info = removeSocketConnection(socket.id);
      if (!info) {
        return;
      }

      const { connectionKey, roomCode, userId } = info;
      if (hasActiveConnection(connectionKey)) {
        return;
      }

      clearDisconnectTimer(connectionKey);
      const timer = setTimeout(() => {
        disconnectTimers.delete(connectionKey);
        if (hasActiveConnection(connectionKey)) {
          return;
        }

        const room = rooms[roomCode];
        if (!room) {
          return;
        }

        if (room.hostUserId === userId) {
          clearPresentationTimer(roomCode);
          clearAllRoomDisconnectTimers(roomCode);
          io.to(roomCode).emit('hostDisconnected');
          delete rooms[roomCode];
          return;
        }

        room.players = room.players.filter((player) => player.id !== userId);
        delete room.votes[userId];
        emitGameState(roomCode);
      }, disconnectGraceMs);

      disconnectTimers.set(connectionKey, timer);
    });
  };
};

module.exports = {
  createSocketHandlers,
  sanitizePlayerName,
  isValidPlayerName,
  normalizePresentationSeconds
};
