import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket, getUserId, API_BASE_URL, ensureSocketConnected, normalizeRoomCode } from '../socket';
import Slideshow from './Slideshow';
import { Users, Play, Settings, Star, Trophy, RefreshCw, Crown, Medal, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
const MotionLi = motion.li;

export default function HostView() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState(null);
    const [categories, setCategories] = useState([]);
    const [includedCategoryIds, setIncludedCategoryIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        fetch(`${API_BASE_URL}/api/categories`)
            .then(res => res.json())
            .then(data => {
                if (!isActive) {
                    return;
                }

                setCategories(data);
                setIncludedCategoryIds(currentIds => currentIds.length > 0 ? currentIds : data.map(c => c.id));
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch categories:', err);
                if (isActive) {
                    setLoading(false);
                }
            });

        const handleGameState = (state) => {
            if (isActive) {
                setGameState(state);
            }
        };

        const requestGameState = async () => {
            try {
                await ensureSocketConnected();
                socket.emit('requestGameState', { roomCode: normalizeRoomCode(roomCode), userId: getUserId() }, (res) => {
                    if (!isActive) {
                        return;
                    }

                    if (!res?.success) {
                        alert('Room not found.');
                        navigate('/');
                    }
                });
            } catch (error) {
                console.error('Failed to request game state:', error);
                if (isActive) {
                    alert('Could not connect to the server.');
                    navigate('/');
                }
            }
        };

        socket.on('gameStateUpdate', handleGameState);
        requestGameState();

        return () => {
            isActive = false;
            socket.off('gameStateUpdate', handleGameState);
        };
    }, [navigate, roomCode]);

    const handleNextSlide = () => socket.emit('nextSlide', { roomCode: normalizeRoomCode(roomCode), userId: getUserId() });
    const handlePrevSlide = () => socket.emit('prevSlide', { roomCode: normalizeRoomCode(roomCode), userId: getUserId() });

    const handleStartRandomPresentation = () => {
        if (!gameState) return;
        const { players } = gameState;

        const validCategories = categories.filter(c => includedCategoryIds.includes(c.id) && c.presentations.length > 0);
        if (validCategories.length === 0) {
            alert("No categories with presentations selected!");
            return;
        }

        const availablePlayers = players.filter(p => !p.hasPresentedThisRound);
        if (availablePlayers.length === 0) {
            alert("All players have presented this round!");
            return;
        }

        const randomCat = validCategories[Math.floor(Math.random() * validCategories.length)];
        const randomPres = randomCat.presentations[Math.floor(Math.random() * randomCat.presentations.length)];
        const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

        socket.emit('startPresentation', { roomCode: normalizeRoomCode(roomCode), userId: getUserId(), presentation: randomPres, presenterId: randomPlayer.id });
    };

    const toggleCategory = (id) => {
        setIncludedCategoryIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleEndPresentation = () => {
        // Move to voting phase instead of ending immediately
        socket.emit('startVoting', { roomCode: normalizeRoomCode(roomCode), userId: getUserId() });
    };

    const handleUpdateSettings = (e) => {
        const maxRounds = parseInt(e.target.value) || 1;
        socket.emit('updateSettings', { roomCode: normalizeRoomCode(roomCode), userId: getUserId(), settings: { maxRounds } });
    };

    const handleRefreshCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/refresh`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setCategories(data.categories);

                // Add any new categories to the included list
                const currentIncludedSet = new Set(includedCategoryIds);
                const newIdsToInclude = data.categories
                    .filter(c => !currentIncludedSet.has(c.id))
                    .map(c => c.id);

                if (newIdsToInclude.length > 0) {
                    setIncludedCategoryIds(prev => [...prev, ...newIdsToInclude]);
                }
            }
        } catch (err) {
            console.error('Failed to refresh:', err);
        }
        setLoading(false);
    };

    const handleLeaveRoom = () => {
        socket.emit('leaveRoom', { roomCode: normalizeRoomCode(roomCode), userId: getUserId(), isHost: true });
        socket.disconnect();
        navigate('/');
    };

    const handleRestartGame = (mode) => {
        if (mode === 'new') {
            setIncludedCategoryIds(categories.map(category => category.id));
            socket.emit('updateSettings', {
                roomCode: normalizeRoomCode(roomCode),
                userId: getUserId(),
                settings: { maxRounds: 2 }
            });
        }

        socket.emit('restartGame', { roomCode: normalizeRoomCode(roomCode), userId: getUserId(), mode });
    };

    if (!gameState) return <div className="host-container flex-center"><h3>Waiting for game state...</h3></div>;

    const { players, status, currentRound, settings, currentPresenter, votes } = gameState;
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const podiumPlayers = [sortedPlayers[1], sortedPlayers[0], sortedPlayers[2]].filter(Boolean);

    if (status === 'presenting' && gameState.presentationState) {
        return (
            <Slideshow
                presentation={gameState.presentationState.presentation}
                currentSlide={gameState.presentationState.currentSlide}
                onEnd={handleEndPresentation}
                onNext={handleNextSlide}
                onPrev={handlePrevSlide}
            />
        );
    }

    if (status === 'voting') {
        const presenter = players.find(p => p.id === currentPresenter);
        const votesCount = Object.keys(votes).length;
        const totalVoters = Math.max(0, players.length - 1); // exclude presenter

        return (
            <div className="host-container flex-center">
                <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card text-center" style={{ maxWidth: 600 }}>
                    <Star size={64} className="mx-auto text-yellow-400 mb-4" />
                    <h2>Voting Phase</h2>
                    <p className="subtitle mt-2">Rate {presenter?.name}'s presentation!</p>

                    <div className="mt-8 mb-8 text-2xl font-bold">
                        {votesCount} / {totalVoters} Votes Submitted
                    </div>

                    <button onClick={() => socket.emit('finishVoting', { roomCode: normalizeRoomCode(roomCode), userId: getUserId() })} className="btn-primary mt-4">
                        Reveal Score & Continue
                    </button>
                </MotionDiv>
            </div>
        );
    }

    if (status === 'leaderboard') {
        return (
            <div className="host-container">
                <div className="top-bar">
                    <h2>Game Over - Final Results!</h2>
                    <div className="player-count final-room-note">
                        <span>Players stay connected in room {normalizeRoomCode(roomCode)}</span>
                    </div>
                </div>
                <div className="leaderboard-layout">
                    <div className="card w-full leaderboard-card">
                        <Trophy size={64} className="mx-auto text-yellow-400 mb-6" />
                        <div className="leaderboard-heading">
                            <h3 className="leaderboard-title">Final Podium</h3>
                            <p className="subtitle leaderboard-subtitle">After {settings.maxRounds} rounds, here are the final scores.</p>
                        </div>

                        <div className="podium-grid">
                            {podiumPlayers.map((player) => {
                                const placement = player.id === sortedPlayers[0]?.id ? 1 : player.id === sortedPlayers[1]?.id ? 2 : 3;
                                const icon = placement === 1 ? <Crown size={28} /> : <Medal size={24} />;

                                return (
                                    <div key={player.id} className={`podium-card place-${placement}`}>
                                        <div className="podium-badge">{icon}</div>
                                        <span className="podium-place">#{placement}</span>
                                        <h4>{player.name}</h4>
                                        <p>{player.score} pts</p>
                                    </div>
                                );
                            })}
                        </div>

                        <ul className="player-list">
                            {sortedPlayers.map((p, index) => (
                                <li key={p.id} className={`leaderboard-row ${index < 3 ? 'leaderboard-top-three' : ''}`}>
                                    <span className="font-bold text-xl">#{index + 1} {p.name}</span>
                                    <span className="text-pink-400 font-bold text-xl">{p.score} pts</span>
                                </li>
                            ))}
                        </ul>

                        <div className="leaderboard-actions">
                            <button onClick={() => handleRestartGame('recreate')} className="btn-primary leaderboard-action-btn">
                                <RotateCcw size={20} /> Replay Same Setup
                            </button>
                            <button onClick={() => handleRestartGame('new')} className="btn-secondary leaderboard-action-btn">
                                <Sparkles size={20} /> Create New Game
                            </button>
                        </div>

                        <button onClick={handleLeaveRoom} className="btn-secondary mt-8">Close Room</button>
                    </div>
                </div>
            </div>
        );
    }

    // Default: Lobby
    return (
        <div className="host-container">
            <div className="top-bar">
                <h2>Room Code: <span className="highlight-text">{roomCode}</span></h2>
                <div className="flex items-center gap-6">
                    <div className="player-count">
                        <Users size={20} />
                        <span>{players.length} / 15 Players</span>
                    </div>
                    <div className="player-count">
                        <span className="font-bold text-blue-400">Round {currentRound} of {settings.maxRounds}</span>
                    </div>
                </div>
            </div>

            <div className="main-content">
                <div className="left-panel">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <h3>Choose a Category</h3>
                            <button
                                onClick={handleRefreshCategories}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded hover:bg-gray-700 transition"
                                title="Refresh files from Google Drive"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Settings size={18} className="text-gray-400" />
                            <label className="text-sm text-gray-400">Total Rounds:</label>
                            <input
                                type="number"
                                min="1" max="10"
                                value={settings.maxRounds}
                                onChange={handleUpdateSettings}
                                className="input-field mb-0 py-1 px-2 w-20 text-center"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="spinner">Loading categories from Google Drive...</div>
                    ) : (
                        <div className="category-list">
                            {categories.length === 0 ? <p>No categories found.</p> : null}
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`category-btn ${includedCategoryIds.includes(cat.id) ? 'active' : ''}`}
                                    onClick={() => toggleCategory(cat.id)}
                                >
                                    {cat.name} ({cat.presentations.length})
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="action-panel mt-6">
                        <p className="text-gray-300 text-center mb-4 text-sm">
                            A random player will be selected to present a random presentation from the highlighted categories.
                        </p>
                        <button
                            className="btn-primary start-btn mx-auto"
                            onClick={handleStartRandomPresentation}
                            disabled={includedCategoryIds.length === 0 || players.length === 0 || players.every(p => p.hasPresentedThisRound)}
                        >
                            <Play size={20} /> Start Random Presentation
                        </button>
                    </div>
                </div>

                <div className="right-panel lobby">
                    <h3><Users size={24} /> Lobby & Scores</h3>
                    <ul className="player-list">
                        <AnimatePresence>
                            {players.length === 0 && <p className="empty-state">Waiting for players to join...</p>}
                            {players.map(p => (
                                <MotionLi
                                    key={p.id}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="flex justify-between items-center"
                                >
                                    <span>
                                        {p.name} {p.hasPresentedThisRound && <span className="text-xs text-green-400 ml-2">(Done)</span>}
                                    </span>
                                    <span className="font-bold text-blue-400">{p.score} pts</span>
                                </MotionLi>
                            ))}
                        </AnimatePresence>
                    </ul>
                </div>
            </div>
        </div>
    );
}
