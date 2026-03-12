const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_SETTINGS,
  normalizeRoomCode,
  canControlPresentation,
  resetRoomForNextGame,
  finalizeVoting
} = require('./gameLogic');

const createRoom = (overrides = {}) => ({
  hostUserId: 'host-1',
  players: [
    { id: 'p1', name: 'Alice', score: 0, hasPresentedThisRound: false },
    { id: 'p2', name: 'Bob', score: 0, hasPresentedThisRound: false }
  ],
  status: 'presenting',
  settings: { maxRounds: 2 },
  currentRound: 1,
  currentPresenter: 'p1',
  votes: {},
  presentationState: { currentSlide: 0, presentation: { id: 'deck-1', title: 'Deck', type: 'pdf', url: '/deck.pdf' } },
  ...overrides
});

test('normalizeRoomCode trims and uppercases room codes', () => {
  assert.equal(normalizeRoomCode(' ab12 '), 'AB12');
});

test('canControlPresentation allows host and presenter only when a presentation is active', () => {
  const room = createRoom();

  assert.equal(canControlPresentation(room, 'host-1'), true);
  assert.equal(canControlPresentation(room, 'p1'), true);
  assert.equal(canControlPresentation(room, 'p2'), false);
  assert.equal(canControlPresentation({ ...room, presentationState: null }, 'host-1'), false);
});

test('resetRoomForNextGame resets scores, votes, slides, and round state', () => {
  const room = createRoom({
    status: 'leaderboard',
    currentRound: 3,
    votes: { p2: 5 },
    players: [
      { id: 'p1', name: 'Alice', score: 45, hasPresentedThisRound: true },
      { id: 'p2', name: 'Bob', score: 30, hasPresentedThisRound: true }
    ]
  });

  resetRoomForNextGame(room, { resetSettings: true });

  assert.equal(room.status, 'lobby');
  assert.equal(room.currentRound, 1);
  assert.equal(room.currentPresenter, null);
  assert.deepEqual(room.votes, {});
  assert.equal(room.presentationState, null);
  assert.deepEqual(room.settings, DEFAULT_SETTINGS);
  assert.deepEqual(room.players.map((player) => ({ score: player.score, hasPresentedThisRound: player.hasPresentedThisRound })), [
    { score: 0, hasPresentedThisRound: false },
    { score: 0, hasPresentedThisRound: false }
  ]);
});

test('finalizeVoting adds presenter score and returns to lobby when round is not finished', () => {
  const room = createRoom({
    status: 'voting',
    votes: { p2: 4 },
    players: [
      { id: 'p1', name: 'Alice', score: 10, hasPresentedThisRound: true },
      { id: 'p2', name: 'Bob', score: 0, hasPresentedThisRound: false }
    ]
  });

  finalizeVoting(room);

  assert.equal(room.players[0].score, 50);
  assert.equal(room.status, 'lobby');
  assert.equal(room.currentRound, 1);
  assert.equal(room.currentPresenter, null);
  assert.equal(room.presentationState, null);
  assert.deepEqual(room.votes, {});
  assert.equal(room.players[0].hasPresentedThisRound, true);
  assert.equal(room.players[1].hasPresentedThisRound, false);
});

test('finalizeVoting advances the round and resets presented flags when everyone has presented', () => {
  const room = createRoom({
    status: 'voting',
    votes: { p2: 3 },
    players: [
      { id: 'p1', name: 'Alice', score: 0, hasPresentedThisRound: true },
      { id: 'p2', name: 'Bob', score: 0, hasPresentedThisRound: true }
    ]
  });

  finalizeVoting(room);

  assert.equal(room.status, 'lobby');
  assert.equal(room.currentRound, 2);
  assert.deepEqual(room.players.map((player) => player.hasPresentedThisRound), [false, false]);
  assert.equal(room.players[0].score, 30);
});

test('finalizeVoting ends the game on the final round', () => {
  const room = createRoom({
    status: 'voting',
    currentRound: 2,
    settings: { maxRounds: 2 },
    votes: { p2: 5 },
    players: [
      { id: 'p1', name: 'Alice', score: 20, hasPresentedThisRound: true },
      { id: 'p2', name: 'Bob', score: 10, hasPresentedThisRound: true }
    ]
  });

  finalizeVoting(room);

  assert.equal(room.status, 'leaderboard');
  assert.equal(room.currentRound, 2);
  assert.equal(room.players[0].score, 70);
  assert.deepEqual(room.votes, {});
});