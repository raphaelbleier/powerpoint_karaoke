import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket, getUserId, ensureSocketConnected, getStoredPlayerName, normalizeRoomCode } from '../socket';
import { ArrowLeft, ArrowRight, XCircle, Star, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

const MotionDiv = motion.div;

export default function ControllerView() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        let isActive = true;

        const handleGameState = (state) => {
            if (isActive) {
                setGameState(state);
            }
        };

        const handleHostDisconnect = () => {
            alert("The host has disconnected. Returning to home.");
            navigate('/');
        };

        const joinRoom = async () => {
            try {
                await ensureSocketConnected();

                const storedPlayerName = getStoredPlayerName();
                if (!storedPlayerName) {
                    alert('Your player name is missing. Please join the room again.');
                    navigate('/');
                    return;
                }

                socket.emit('joinRoom', {
                    roomCode: normalizeRoomCode(roomCode),
                    playerName: storedPlayerName,
                    userId: getUserId()
                }, (res) => {
                    if (!isActive) {
                        return;
                    }

                    if (!res.success || res.isHost) {
                        navigate('/');
                        return;
                    }

                    socket.emit('requestGameState', {
                        roomCode: normalizeRoomCode(roomCode),
                        userId: getUserId()
                    });
                });
            } catch (error) {
                console.error('Failed to reconnect controller:', error);
                if (isActive) {
                    alert('Could not reconnect to the room.');
                    navigate('/');
                }
            }
        };

        const handleReconnect = () => {
            joinRoom();
        };

        socket.on('gameStateUpdate', handleGameState);
        socket.on('hostDisconnected', handleHostDisconnect);
        socket.on('connect', handleReconnect);

        joinRoom();

        return () => {
            isActive = false;
            socket.off('gameStateUpdate', handleGameState);
            socket.off('hostDisconnected', handleHostDisconnect);
            socket.off('connect', handleReconnect);
        };
    }, [navigate, roomCode]);

    const handleNext = () => socket.emit('nextSlide', { roomCode: normalizeRoomCode(roomCode), userId: getUserId() });
    const handlePrev = () => socket.emit('prevSlide', { roomCode: normalizeRoomCode(roomCode), userId: getUserId() });
    const handleLeave = () => {
        socket.emit('leaveRoom', { roomCode: normalizeRoomCode(roomCode), userId: getUserId(), isHost: false });
        socket.disconnect();
        navigate('/');
    };

    const handleVote = (score) => {
        socket.emit('submitVote', { roomCode: normalizeRoomCode(roomCode), userId: getUserId(), score });
    };

    const controllerBrand = (
        <BrandLogo
            variant="icon"
            showText={false}
            className="controller-brand"
            imageClassName="controller-brand-icon"
        />
    );

    if (!gameState) {
        return (
            <div className="controller-container flex-center">
                <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="waiting-box">
                    {controllerBrand}
                    <h2>Room: {roomCode}</h2>
                    <div className="pulsing-circle"></div>
                    <p>You're in! Waiting for the host...</p>
                    <button onClick={handleLeave} className="btn-secondary mt-10">Leave Room</button>
                </MotionDiv>
            </div>
        );
    }

    const { status, currentPresenter, votes, players, presentationState } = gameState;
    const isMePresenting = currentPresenter === getUserId();

    if (status === 'lobby') {
        return (
            <div className="controller-container flex-center">
                <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="waiting-box">
                    {controllerBrand}
                    <h2>Room: {roomCode}</h2>
                    <div className="pulsing-circle"></div>
                    <p>Waiting in Lobby...</p>
                    <p className="mt-4 text-blue-400">Round {gameState.currentRound} of {gameState.settings.maxRounds}</p>
                    <button onClick={handleLeave} className="btn-secondary mt-10">Leave Room</button>
                </MotionDiv>
            </div>
        );
    }

    if (status === 'presenting') {
        if (isMePresenting && presentationState) {
            return (
                <div className="controller-container active-mode">
                    <div className="header">
                        <BrandLogo
                            variant="icon"
                            showText={false}
                            className="controller-brand-inline"
                            imageClassName="controller-brand-inline-icon"
                        />
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
            const presenterObj = players.find(p => p.id === currentPresenter);
            const presenterName = presenterObj?.name || 'Someone';
            return (
                <div className="controller-container flex-center">
                    <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="waiting-box">
                        {controllerBrand}
                        <h2>👀 Look at the screen!</h2>
                        <div className="pulsing-circle" style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' }}></div>
                        <p className="text-xl font-bold text-green-400">{presenterName}</p>
                        <p>is currently presenting.</p>

                    </MotionDiv>
                </div>
            );
        }
    }

    if (status === 'voting') {
        if (isMePresenting) {
            return (
                <div className="controller-container flex-center">
                    <div className="waiting-box">
                        {controllerBrand}
                        <h2>Done! 🎉</h2>
                        <p className="mt-4">Relax while the others vote on your presentation.</p>
                    </div>
                </div>
            );
        }

        const hasVoted = votes[getUserId()] !== undefined;

        if (hasVoted) {
            return (
                <div className="controller-container flex-center">
                    <div className="waiting-box">
                        {controllerBrand}
                        <h2>Vote Submitted! ✅</h2>
                        <p className="mt-4 text-gray-400">Waiting for others to finish voting...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="controller-container vote-screen p-4">
                {controllerBrand}
                <h2 className="text-2xl font-bold mb-6 text-center">Rate the Presentation!</h2>
                <div className="vote-options">
                    {[5, 4, 3, 2, 1].map((star) => (
                        <button
                            key={star}
                            onClick={() => handleVote(star)}
                            className="btn-primary vote-option-btn py-4 text-xl"
                            style={{ background: star > 3 ? '#3b82f6' : star === 3 ? '#8b5cf6' : '#ec4899' }}
                        >
                            <div className="vote-stars">
                                {[...Array(star)].map((_, i) => <Star key={i} size={24} fill="currentColor" />)}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (status === 'leaderboard') {
        return (
            <div className="controller-container flex-center">
                <MotionDiv initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="waiting-box">
                    {controllerBrand}
                    <Award size={64} className="mx-auto text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                    <p className="text-xl text-gray-400">Look at the big screen for final results!</p>
                    <button onClick={handleLeave} className="btn-secondary mt-10">Return to Home</button>
                </MotionDiv>
            </div>
        );
    }

    return null;
}
