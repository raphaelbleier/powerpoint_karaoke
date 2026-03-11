import { io } from 'socket.io-client';

// When running locally, the dev server might be on 5173 and backend on 8080.
// When compiled, both are on the same port.
const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:8080' : '/';

export const socket = io(SOCKET_URL, {
    autoConnect: false // Connect manually when needed
});
