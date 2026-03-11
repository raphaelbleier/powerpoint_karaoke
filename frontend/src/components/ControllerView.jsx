import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket, getUserId } from '../socket';
import { ArrowLeft, ArrowRight, XCircle, Star, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ControllerView() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        const handleGameState = (state) => {
            setGameState(state);
        };

        const handleHostDisconnect = () => {
            alert("The host has disconnected. Returning to home.");
            navigate('/');
        };

        socket.on('gameStateUpdate', handleGameState);
        socket.on('hostDisconnected', handleHostDisconnect);

        // Auto-reconnect if refreshing
        if (socket.connected) {
            socket.emit('joinRoom', { roomCode, playerName: "Player", userId: getUserId() }, (res) => {
                if (!res.success) navigate('/');
            });
        } else {
            socket.connect();
            setTimeout(() => {
                socket.emit('joinRoom', { roomCode, playerName: "Player", userId: getUserId() }, (res) => {
                    if (!res.success) navigate('/');
                });
            }, 500);
        }

        return () => {
            socket.off('gameStateUpdate', handleGameState);
            socket.off('hostDisconnected', handleHostDisconnect);
        };
    }, [navigate, roomCode]);

    const handleNext = () => socket.emit('nextSlide', { roomCode, userId: getUserId() });
    const handlePrev = () => socket.emit('prevSlide', { roomCode, userId: getUserId() });
    const handleLeave = () => {
        socket.emit('leaveRoom', { roomCode, userId: getUserId(), isHost: false });
        socket.disconnect();
        navigate('/');
    };

    const handleVote = (score) => {
        socket.emit('submitVote', { roomCode, userId: getUserId(), score });
    };

    if (!gameState) {
        return (
            <div className="controller-container flex-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="waiting-box">
                    <h2>Room: {roomCode}</h2>
                    <div className="pulsing-circle"></div>
                    <p>You're in! Waiting for the host...</p>
                    <button onClick={handleLeave} className="btn-secondary mt-10">Leave Room</button>
                </motion.div>
            </div>
        );
    }

    const { status, currentPresenter, votes, players, presentationState } = gameState;
    const isMePresenting = currentPresenter === socket.id;

    if (status === 'lobby') {
        return (
            <div className="controller-container flex-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="waiting-box">
                    <h2>Room: {roomCode}</h2>
                    <div className="pulsing-circle"></div>
                    <p>Waiting in Lobby...</p>
                    <p className="mt-4 text-blue-400">Round {gameState.currentRound} of {gameState.settings.maxRounds}</p>
                    <button onClick={handleLeave} className="btn-secondary mt-10">Leave Room</button>
                </motion.div>
            </div>
        );
    }

    if (status === 'presenting') {
        if (isMePresenting && presentationState) {
            return (
                <div className="controller-container active-mode">
                    <div className="header">
                        <h3>You are Presenting!</h3>
                        <p className="topic-title">{presentationState.presentation.title}</p>
                    </div>

                    <div className="controls">
                        <button className="control-btn prev" onClick={handlePrev}>
                            <ArrowLeft size={48} />
                            <span>Previous</span>
                        </button>
                        <button className="control-btn next" onClick={handleNext}>
                            <span>Next</span>
                            <ArrowRight size={48} />
                        </button>
                    </div>

                    <div className="footer">
                        <button onClick={handleLeave} className="leave-btn">
                            <XCircle size={20} /> Leave Game
                        </button>
                    </div>
                </div>
            );
        } else {
            const presenterName = players.find(p => p.id === currentPresenter)?.name || 'Someone';
            return (
                <div className="controller-container flex-center">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="waiting-box">
                        <h2>👀 Look at the screen!</h2>
                        <div className="pulsing-circle" style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' }}></div>
                        <p className="text-xl font-bold text-green-400">{presenterName}</p>
                        <p>is currently presenting.</p>
                    </motion.div>
                </div>
            );
        }
    }

    if (status === 'voting') {
        if (isMePresenting) {
            return (
                <div className="controller-container flex-center">
                    <div className="waiting-box">
                        <h2>Done! 🎉</h2>
                        <p className="mt-4">Relax while the others vote on your presentation.</p>
                    </div>
                </div>
            );
        }

        const hasVoted = votes[socket.id] !== undefined;

        if (hasVoted) {
            return (
                <div className="controller-container flex-center">
                    <div className="waiting-box">
                        <h2>Vote Submitted! ✅</h2>
                        <p className="mt-4 text-gray-400">Waiting for others to finish voting...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="controller-container flex flex-col justify-center items-center p-4">
                <h2 className="text-2xl font-bold mb-6 text-center">Rate the Presentation!</h2>
                <div className="flex flex-col gap-4 w-full max-w-sm">
                    {[5, 4, 3, 2, 1].map((star) => (
                        <button
                            key={star}
                            onClick={() => handleVote(star)}
                            className="btn-primary w-full py-4 text-xl flex justify-center items-center gap-2"
                            style={{ background: star > 3 ? '#3b82f6' : star === 3 ? '#8b5cf6' : '#ec4899' }}
                        >
                            {[...Array(star)].map((_, i) => <Star key={i} size={24} fill="currentColor" />)}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (status === 'leaderboard') {
        return (
            <div className="controller-container flex-center">
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="waiting-box">
                    <Award size={64} className="mx-auto text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                    <p className="text-xl text-gray-400">Look at the big screen for final results!</p>
                    <button onClick={handleLeave} className="btn-secondary mt-10">Return to Home</button>
                </motion.div>
            </div>
        );
    }

    return null;
}
