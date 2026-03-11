import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Monitor, Smartphone, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState('');
    const [playerName, setPlayerName] = useState('');

    const handleCreateRoom = () => {
        socket.connect();
        socket.emit('createRoom', (res) => {
            navigate(`/host/${res.roomCode}`);
        });
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (!joinCode || !playerName) return;

        socket.connect();
        socket.emit('joinRoom', { roomCode: joinCode, playerName }, (res) => {
            if (res.success) {
                navigate(`/controller/${joinCode}`);
            } else {
                alert(res.message);
            }
        });
    };

    return (
        <div className="home-container">
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h1 className="title">Kapopo <span>Clone</span></h1>
                <p className="subtitle">PowerPoint Karaoke powered by Google Drive</p>
            </motion.div>

            <div className="card-grid">
                <motion.div
                    className="card host-card"
                    initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                >
                    <Monitor size={48} className="icon mx-auto text-blue-400" />
                    <h2>Host a Game</h2>
                    <p>Start a new session on this device. Others can join using their phones to control the slides and see the lobby.</p>
                    <button onClick={handleCreateRoom} className="btn-primary">
                        Create Room
                    </button>
                </motion.div>

                <motion.div
                    className="card join-card"
                    initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                >
                    <Smartphone size={48} className="icon mx-auto text-pink-400" />
                    <h2>Join a Game</h2>
                    <p>Connect your phone as a controller to an existing game hosted on another screen.</p>
                    <form onSubmit={handleJoinRoom} className="join-form">
                        <input
                            type="text"
                            placeholder="Room Code (e.g. 1234)"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className="input-field"
                            maxLength={4}
                        />
                        <input
                            type="text"
                            placeholder="Your Name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="input-field"
                        />
                        <button type="submit" className="btn-secondary">
                            Join Room
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
