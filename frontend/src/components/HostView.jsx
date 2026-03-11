import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import Slideshow from './Slideshow';
import { Users, Play, Settings, Star, Trophy, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HostView() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedPresenter, setSelectedPresenter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const API_URL = import.meta.env.DEV ? 'http://localhost:8080' : '';

        fetch(`${API_URL}/api/categories`)
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch categories:', err);
                setLoading(false);
            });

        const handleGameState = (state) => {
            setGameState(state);
        };

        socket.on('gameStateUpdate', handleGameState);

        // Attempt to fetch state in case we missed the initial emit or refreshed
        if (socket.connected) {
            socket.emit('requestGameState', { roomCode });
        } else {
            socket.connect();
            setTimeout(() => socket.emit('requestGameState', { roomCode }), 500);
        }

        return () => {
            socket.off('gameStateUpdate', handleGameState);
        };
    }, [roomCode]);

    const handleNextSlide = () => socket.emit('nextSlide', { roomCode });
    const handlePrevSlide = () => socket.emit('prevSlide', { roomCode });

    const handleStartRandomPresentation = () => {
        if (!selectedCategory || !selectedCategory.presentations.length || !selectedPresenter) return;

        const count = selectedCategory.presentations.length;
        const randomIndex = Math.floor(Math.random() * count);
        const presentation = selectedCategory.presentations[randomIndex];

        socket.emit('startPresentation', { roomCode, presentation, presenterId: selectedPresenter });
    };

    const handleEndPresentation = () => {
        // Move to voting phase instead of ending immediately
        socket.emit('startVoting', { roomCode });
    };

    const handleUpdateSettings = (e) => {
        const maxRounds = parseInt(e.target.value) || 1;
        socket.emit('updateSettings', { roomCode, settings: { maxRounds } });
    };

    const handleRefreshCategories = async () => {
        setLoading(true);
        const API_URL = import.meta.env.DEV ? 'http://localhost:8080' : '';
        try {
            const res = await fetch(`${API_URL}/api/refresh`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setCategories(data.categories);
            }
        } catch (err) {
            console.error('Failed to refresh:', err);
        }
        setLoading(false);
    };

    if (!gameState) return <div className="host-container flex-center"><h3>Waiting for game state...</h3></div>;

    const { players, status, currentRound, settings, currentPresenter, votes } = gameState;

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
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card text-center" style={{ maxWidth: 600 }}>
                    <Star size={64} className="mx-auto text-yellow-400 mb-4" />
                    <h2>Voting Phase</h2>
                    <p className="subtitle mt-2">Rate {presenter?.name}'s presentation!</p>

                    <div className="mt-8 mb-8 text-2xl font-bold">
                        {votesCount} / {totalVoters} Votes Submitted
                    </div>

                    <button onClick={() => socket.emit('finishVoting', { roomCode })} className="btn-primary mt-4">
                        Reveal Score & Continue
                    </button>
                </motion.div>
            </div>
        );
    }

    if (status === 'leaderboard') {
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        return (
            <div className="host-container">
                <div className="top-bar">
                    <h2>Game Over - Final Results!</h2>
                </div>
                <div className="card-grid" style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div className="card w-full">
                        <Trophy size={64} className="mx-auto text-yellow-400 mb-6" />
                        <ul className="player-list">
                            {sortedPlayers.map((p, index) => (
                                <li key={p.id} className="flex justify-between items-center bg-gray-800 p-4 rounded mb-2">
                                    <span className="font-bold text-xl">#{index + 1} {p.name}</span>
                                    <span className="text-pink-400 font-bold text-xl">{p.score} pts</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => navigate('/')} className="btn-secondary mt-8">Return Home</button>
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
                                    className={`category-btn ${selectedCategory?.id === cat.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat.name} ({cat.presentations.length})
                                </button>
                            ))}
                        </div>
                    )}

                    <AnimatePresence>
                        {selectedCategory && (
                            <motion.div
                                className="action-panel mt-6"
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            >
                                <p>Ready to present a random topic from <strong>{selectedCategory.name}</strong>?</p>

                                <div className="flex items-center gap-4 justify-center mt-4 mb-4">
                                    <label>Who is presenting?</label>
                                    <select
                                        className="input-field mb-0 w-64"
                                        value={selectedPresenter}
                                        onChange={(e) => setSelectedPresenter(e.target.value)}
                                    >
                                        <option value="" disabled>Select Player</option>
                                        {players.filter(p => !p.hasPresentedThisRound).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    className="btn-primary start-btn mx-auto"
                                    onClick={handleStartRandomPresentation}
                                    disabled={selectedCategory.presentations.length === 0 || !selectedPresenter}
                                >
                                    <Play size={20} /> Start Presentation
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="right-panel lobby">
                    <h3><Users size={24} /> Lobby & Scores</h3>
                    <ul className="player-list">
                        <AnimatePresence>
                            {players.length === 0 && <p className="empty-state">Waiting for players to join...</p>}
                            {players.map(p => (
                                <motion.li
                                    key={p.id}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="flex justify-between items-center"
                                >
                                    <span>
                                        {p.name} {p.hasPresentedThisRound && <span className="text-xs text-green-400 ml-2">(Done)</span>}
                                    </span>
                                    <span className="font-bold text-blue-400">{p.score} pts</span>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                </div>
            </div>
        </div>
    );
}
