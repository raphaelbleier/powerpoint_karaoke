import { io } from 'socket.io-client';

const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const API_BASE_URL = import.meta.env.DEV ? `http://${browserHost}:8080` : '';
const SOCKET_URL = import.meta.env.DEV ? API_BASE_URL : '/';
const PLAYER_NAME_KEY = 'kapopo_playerName';

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

export const getStoredPlayerName = () => localStorage.getItem(PLAYER_NAME_KEY) || '';

export const setStoredPlayerName = (playerName) => {
    const normalizedName = playerName.trim();
    if (normalizedName) {
        localStorage.setItem(PLAYER_NAME_KEY, normalizedName);
    }
};

export const getUserId = () => {
    let id = localStorage.getItem('kapopo_userId');
    if (!id) {
        id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('kapopo_userId', id);
    }
    return id;
};
