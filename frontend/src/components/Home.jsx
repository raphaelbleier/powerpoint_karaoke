import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket, getUserId, ensureSocketConnected, normalizeRoomCode, setStoredPlayerName } from '../socket';
import { Monitor, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

export default function Home() {
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState('');
    const [playerName, setPlayerName] = useState('');

    const handleCreateRoom = async () => {
        try {
            await ensureSocketConnected();
            socket.emit('createRoom', { userId: getUserId() }, (res) => {
                navigate(`/host/${res.roomCode}`);
            });
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('Could not connect to the server. Please try again.');
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        const normalizedRoomCode = normalizeRoomCode(joinCode);
        const normalizedPlayerName = playerName.trim();

        if (!normalizedRoomCode || !normalizedPlayerName) return;

        try {
            await ensureSocketConnected();
            socket.emit('joinRoom', { roomCode: normalizedRoomCode, playerName: normalizedPlayerName, userId: getUserId() }, (res) => {
                if (res.success) {
                    setStoredPlayerName(normalizedPlayerName);
                    if (res.isHost) {
                        navigate(`/host/${normalizedRoomCode}`);
                    } else {
                        navigate(`/controller/${normalizedRoomCode}`);
                    }
                } else {
                    alert(res.message);
                }
            });
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('Could not connect to the server. Please try again.');
        }
    };

    return (
        <div className="home-container">
            <MotionDiv
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h1 className="title">Kapopo <span>Clone</span></h1>
                <p className="subtitle">PowerPoint Karaoke powered by Google Drive</p>
            </MotionDiv>

            <div className="card-grid">
                <MotionDiv
                    className="card host-card"
                    initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                >
                    <Monitor size={48} className="icon mx-auto text-blue-400" />
                    <h2>Host a Game</h2>
                    <p>Start a new session on this device. Others can join using their phones to control the slides and see the lobby.</p>
                    <button onClick={handleCreateRoom} className="btn-primary">
                        Create Room
                    </button>
                </MotionDiv>

                <MotionDiv
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
                            onChange={(e) => setJoinCode(normalizeRoomCode(e.target.value))}
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
                </MotionDiv>
            </div>
        </div>
    );
}
