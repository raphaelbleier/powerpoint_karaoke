const DEFAULT_SETTINGS = {
  maxRounds: 2,
  presentationSeconds: 120
};

const normalizeRoomCode = (roomCode = '') => roomCode.trim().toUpperCase();

const canControlPresentation = (room, userId) => {
  if (!room || !room.presentationState) {
    return false;
  }

  return room.hostUserId === userId || room.currentPresenter === userId;
};

const resetRoomForNextGame = (room, { resetSettings = false } = {}) => {
  room.status = 'lobby';
  room.currentRound = 1;
  room.currentPresenter = null;
  room.votes = {};
  room.presentationState = null;
  room.presentationEndsAt = null;

  if (resetSettings) {
    room.settings = { ...DEFAULT_SETTINGS };
  }

  room.players = room.players.map((player) => ({
    ...player,
    score: 0,
    hasPresentedThisRound: false
  }));

  return room;
};

const finalizeVoting = (room) => {
  const voteValues = Object.values(room.votes);
  const avgScore = voteValues.length > 0
    ? voteValues.reduce((sum, value) => sum + value, 0) / voteValues.length
    : 0;

  const presenter = room.players.find((player) => player.id === room.currentPresenter);
  if (presenter) {
    presenter.score += Math.round(avgScore * 10);
  }

  const allPresented = room.players.every((player) => player.hasPresentedThisRound);

  if (allPresented) {
    if (room.currentRound >= room.settings.maxRounds) {
      room.status = 'leaderboard';
    } else {
      room.currentRound += 1;
      room.players.forEach((player) => {
        player.hasPresentedThisRound = false;
      });
      room.status = 'lobby';
    }
  } else {
    room.status = 'lobby';
  }

  room.currentPresenter = null;
  room.presentationState = null;
  room.votes = {};

  return room;
};

module.exports = {
  DEFAULT_SETTINGS,
  normalizeRoomCode,
  canControlPresentation,
  resetRoomForNextGame,
  finalizeVoting
};