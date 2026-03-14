const test = require('node:test');
const assert = require('node:assert/strict');

const { createSocketHandlers } = require('../socketHandlers');

class MockIo {
  constructor() {
    this.messages = [];
  }

  to(roomCode) {
    return {
      emit: (event, payload) => {
        this.messages.push({ roomCode, event, payload });
      }
    };
  }
}

class MockSocket {
  constructor(id) {
    this.id = id;
    this.handlers = {};
    this.emitted = [];
    this.joinedRooms = [];
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  emit(event, payload) {
    this.emitted.push({ event, payload });
  }

  join(roomCode) {
    this.joinedRooms.push(roomCode);
  }

  trigger(event, payload, callback) {
    if (!this.handlers[event]) {
      throw new Error(`No handler for event: ${event}`);
    }

    this.handlers[event](payload, callback);
  }

  disconnectNow() {
    if (this.handlers.disconnect) {
      this.handlers.disconnect();
    }
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setupHandlers = (disconnectGraceMs = 40) => {
  const rooms = {};
  const io = new MockIo();
  let nextRoomCode = 1234;

  const register = createSocketHandlers({
    io,
    rooms,
    disconnectGraceMs,
    generateRoomCode: () => String(nextRoomCode++)
  });

  return { rooms, io, register };
};

test('socket flow: createRoom initializes timer settings', () => {
  const { rooms, register } = setupHandlers();
  const hostSocket = new MockSocket('host-socket');
  register(hostSocket);

  let createdRoomCode = null;
  hostSocket.trigger('createRoom', { userId: 'host-1' }, ({ roomCode }) => {
    createdRoomCode = roomCode;
  });

  assert.equal(createdRoomCode, '1234');
  assert.equal(rooms[createdRoomCode].settings.maxRounds, 2);
  assert.equal(rooms[createdRoomCode].settings.presentationSeconds, 120);
  assert.equal(rooms[createdRoomCode].presentationEndsAt, null);
});

test('socket flow: joinRoom sanitizes and validates player names', () => {
  const { rooms, register } = setupHandlers();

  const hostSocket = new MockSocket('host-socket');
  register(hostSocket);
  let roomCode = null;
  hostSocket.trigger('createRoom', { userId: 'host-1' }, ({ roomCode: code }) => {
    roomCode = code;
  });

  const playerSocket = new MockSocket('player-socket');
  register(playerSocket);

  let joinResponse = null;
  playerSocket.trigger('joinRoom', {
    roomCode,
    userId: 'p1',
    playerName: '  <A!ice>  '
  }, (response) => {
    joinResponse = response;
  });

  assert.equal(joinResponse.success, false);

  playerSocket.trigger('joinRoom', {
    roomCode,
    userId: 'p1',
    playerName: '  Alice_1  '
  }, (response) => {
    joinResponse = response;
  });

  assert.equal(joinResponse.success, true);
  assert.equal(joinResponse.playerName, 'Alice_1');
  assert.equal(rooms[roomCode].players[0].name, 'Alice_1');
});

test('socket flow: disconnected player is removed after grace period', async () => {
  const { rooms, register } = setupHandlers(25);

  const hostSocket = new MockSocket('host-socket');
  register(hostSocket);
  let roomCode = null;
  hostSocket.trigger('createRoom', { userId: 'host-1' }, ({ roomCode: code }) => {
    roomCode = code;
  });

  const playerSocket = new MockSocket('player-socket');
  register(playerSocket);
  playerSocket.trigger('joinRoom', {
    roomCode,
    userId: 'p1',
    playerName: 'Alice'
  }, () => {});

  assert.equal(rooms[roomCode].players.length, 1);

  playerSocket.disconnectNow();
  await wait(40);

  assert.equal(rooms[roomCode].players.length, 0);
});

test('socket flow: reconnect during grace period keeps player in room', async () => {
  const { rooms, register } = setupHandlers(60);

  const hostSocket = new MockSocket('host-socket');
  register(hostSocket);
  let roomCode = null;
  hostSocket.trigger('createRoom', { userId: 'host-1' }, ({ roomCode: code }) => {
    roomCode = code;
  });

  const firstSocket = new MockSocket('player-socket-1');
  register(firstSocket);
  firstSocket.trigger('joinRoom', {
    roomCode,
    userId: 'p1',
    playerName: 'Alice'
  }, () => {});

  firstSocket.disconnectNow();

  const secondSocket = new MockSocket('player-socket-2');
  register(secondSocket);
  secondSocket.trigger('joinRoom', {
    roomCode,
    userId: 'p1',
    playerName: 'Alice'
  }, () => {});

  await wait(90);
  assert.equal(rooms[roomCode].players.length, 1);
  assert.equal(rooms[roomCode].players[0].id, 'p1');
});

test('socket flow: presentation timer auto-transitions to voting', async () => {
  const { rooms, register } = setupHandlers(25);

  const hostSocket = new MockSocket('host-socket');
  register(hostSocket);
  let roomCode = null;
  hostSocket.trigger('createRoom', { userId: 'host-1' }, ({ roomCode: code }) => {
    roomCode = code;
  });

  const playerSocket = new MockSocket('player-socket');
  register(playerSocket);
  playerSocket.trigger('joinRoom', {
    roomCode,
    userId: 'p1',
    playerName: 'Alice'
  }, () => {});

  rooms[roomCode].settings.presentationSeconds = 0.01;

  hostSocket.trigger('startPresentation', {
    roomCode,
    userId: 'host-1',
    presenterId: 'p1',
    presentation: { id: 'deck-1', title: 'Deck', type: 'pdf', url: '/deck.pdf' }
  });

  assert.equal(rooms[roomCode].status, 'presenting');
  assert.ok(rooms[roomCode].presentationEndsAt);

  await wait(35);

  assert.equal(rooms[roomCode].status, 'voting');
  assert.equal(rooms[roomCode].presentationEndsAt, null);
});
