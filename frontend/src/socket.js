import { io } from 'socket.io-client';

const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const API_BASE_URL = import.meta.env.DEV ? `http://${browserHost}:8080` : '';
const SOCKET_URL = import.meta.env.DEV ? API_BASE_URL : '/';
const PLAYER_NAME_KEY = 'presentOrPanic_playerName';
const LEGACY_PLAYER_NAME_KEY = 'kapopo_playerName';
const USER_ID_KEY = 'presentOrPanic_userId';
const LEGACY_USER_ID_KEY = 'kapopo_userId';

export const sanitizePlayerName = (value = '') => {
    const raw = typeof value === 'string' ? value : '';
    const strippedUnsafeChars = raw.replace(/[<>`]/g, '');
    const strippedControlChars = [...strippedUnsafeChars]
        .filter((char) => {
            const code = char.charCodeAt(0);
            return code >= 32 && code !== 127;
        })
        .join('');

    return strippedControlChars.replace(/\s+/g, ' ').trim();
};

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true
});

export const ensureSocketConnected = () => new Promise((resolve, reject) => {
    if (socket.connected) {
        resolve(socket);
        return;
    }

    const handleConnect = () => {
        cleanup();
        resolve(socket);
    };

    const handleError = (error) => {
        cleanup();
        reject(error);
    };

    const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error('Socket connection timed out'));
    }, 5000);

    const cleanup = () => {
        socket.off('connect', handleConnect);
        socket.off('connect_error', handleError);
        window.clearTimeout(timeoutId);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleError);
    socket.connect();
});

export const normalizeRoomCode = (roomCode = '') => roomCode.trim().toUpperCase();

export const getStoredPlayerName = () => {
    const storedName = localStorage.getItem(PLAYER_NAME_KEY) || localStorage.getItem(LEGACY_PLAYER_NAME_KEY) || '';

    if (storedName && !localStorage.getItem(PLAYER_NAME_KEY)) {
        localStorage.setItem(PLAYER_NAME_KEY, storedName);
        localStorage.removeItem(LEGACY_PLAYER_NAME_KEY);
    }

    return storedName;
};

export const setStoredPlayerName = (playerName) => {
    const normalizedName = sanitizePlayerName(playerName);
    if (normalizedName) {
        localStorage.setItem(PLAYER_NAME_KEY, normalizedName);
        localStorage.removeItem(LEGACY_PLAYER_NAME_KEY);
    }
};

export const getUserId = () => {
    let id = localStorage.getItem(USER_ID_KEY) || localStorage.getItem(LEGACY_USER_ID_KEY);
    if (!id) {
        id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    localStorage.setItem(USER_ID_KEY, id);
    localStorage.removeItem(LEGACY_USER_ID_KEY);

    return id;
};
