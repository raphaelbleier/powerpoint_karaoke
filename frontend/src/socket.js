import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:8080' : '/';

export const socket = io(SOCKET_URL, {
    autoConnect: false
});

export const getUserId = () => {
    let id = localStorage.getItem('kapopo_userId');
    if (!id) {
        id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('kapopo_userId', id);
    }
    return id;
};
