// src/pages/GamePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext'; // Centralized game context
import './GamePage.css'; // New CSS file for global game page elements

const GamePage = ({ children, isMobile }) => {
    const {
        roomCode, playerId, isHost,
        gameState,
        getGameState,
        leaveRoom,
        deleteRoom,
        error, setError,
        isLoadingGame, setIsLoadingGame
    } = useGame();

    const navigate = useNavigate();
    const { gameType } = useParams(); // Get gameType from URL for display

    const [minPlayersRequired, setMinPlayersRequired] = useState(0);
    const [maxPlayersAllowed, setMaxPlayersAllowed] = useState(0);

    // --- Global Game Page Handlers ---
    const handleLeaveRoom = async () => {
        // Use the context's leaveRoom function
        await leaveRoom();
        // Navigation is handled by leaveRoom inside GameContext
    };

    const handleDeleteRoom = async () => {
        if (!window.confirm("Are you sure you want to delete this room? This cannot be undone.")) {
            return;
        }
        // Use the context's deleteRoom function
        await deleteRoom();
        // Navigation is handled by deleteRoom inside GameContext
    };

    // Effect to fetch game state on initial load or roomCode change
    useEffect(() => {
        // getGameState is now without params, it uses context state (roomCode, playerId)
        getGameState();
    }, [getGameState]); // Dependency array: getGameState is memoized by useCallback

    // Update min/max players from gameState
    useEffect(() => {
        if (gameState) {
            setMinPlayersRequired(gameState.MIN_PLAYERS || 0);
            setMaxPlayersAllowed(gameState.MAX_PLAYERS || 0);
        }
    }, [gameState]);

    // Effect to fetch game state on initial load or roomCode change
    useEffect(() => {
        const fetchGameData = async () => {
            if (roomCode) {
                await getGameState(roomCode);
            } else {
                console.warn("No roomCode found. Redirecting to home.");
                navigate('/');
            }
        };
        fetchGameData();
    }, [roomCode, getGameState, navigate]);

    // Update min/max players from gameState
    useEffect(() => {
        if (gameState) {
            setMinPlayersRequired(gameState.MIN_PLAYERS || 0);
            setMaxPlayersAllowed(gameState.MAX_PLAYERS || 0);
        }
    }, [gameState]);

    // Derived state for convenience
    const allPlayersData = gameState?.all_players_data || [];
    const currentPlayers = allPlayersData.length;
    const currentPlayerName = allPlayersData.find(p => p.id === gameState?.current_turn_player_id)?.name;
    const displayGameType = gameType ? gameType.charAt(0).toUpperCase() + gameType.slice(1).toLowerCase() : 'Game';

    // --- Conditional Rendering for Loading ---
    if (isLoadingGame || !gameState || !gameState.all_players_data) {
        return (
            <div className="game-page-loading">
                <p>Loading {displayGameType} game data...</p>
                {error && <p className="error-message">{error}</p>}
            </div>
        );
    }

    return (
        <div className="game-page-container">
            {!isMobile && (
            <div className="game-page-top-info desktop-ui">
                    <h2 className="game-page-title">{displayGameType} Game Board</h2>

                    <div className="lobby-status-section">
                        <h4>Lobby Status</h4>
                        <div className="lobby-status-grid">
                            <div className="lobby-status-row">
                                <span className="lobby-label">Current:</span>
                                <div className="status-indicator-group">
                                    <span className={`status-light ${currentPlayers >= minPlayersRequired ? 'active-game' : 'inactive-game'}`}></span>
                                    <span className="status-value">{currentPlayers}</span>
                                </div>
                            </div>
                            <div className="lobby-status-row">
                                <span className="lobby-label">Min Players:</span>
                                <span className="status-value">{minPlayersRequired}</span>
                            </div>
                            <div className="lobby-status-row">
                                <span className="lobby-label">Max Players:</span>
                                <span className="status-value">{maxPlayersAllowed}</span>
                            </div>
                        </div>
                    </div>
                    <div className="header-right-info-column">
                        <div className="room-code-display">
                            <span className="room-code-label">ROOM CODE</span>
                            <span className="room-code-value">{roomCode}</span>
                        </div>

                        <div className="room-management-actions game-page-actions">
                            <button onClick={handleLeaveRoom} className="button leave-room-button">
                                Leave Room
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isMobile && (
                <div className="game-page-top-info mobile-ui">
                    <h2 className="game-page-title-mobile">{displayGameType} Board</h2> {/* More compact title */}
                    <div className="mobile-info-bar">
                        <div className="mobile-room-code">
                            <span>Room:</span> <strong>{roomCode}</strong>
                        </div>
                        <div className="mobile-player-count">
                            <span>Players:</span> {currentPlayers}/{maxPlayersAllowed}
                        </div>
                    </div>
                    <div className="mobile-game-actions-bar">
                        <button onClick={handleLeaveRoom} className="button small-button mobile-action-button">
                            Leave
                        </button>
                    </div>
                </div>
            )}

            {/* Player Status Sidebar (horizontal on mobile) */}
            <div className="player-status-sidebar">
                <div className="player-list-grid">
                    {allPlayersData.map(player => (
                        <div key={player.id} className={`player-item ${player.id === playerId ? 'you' : ''}`}>
                            <div className="player-name-wrapper">
                                    {/* Main status light */}
                                    <div className="status-light-container">
                                        <span className={`status-light ${player.is_active ? 'active' : 'inactive'}`}></span>                                 
                                    </div>

                                    <span className="player-name">
                                        {player.name === gameState.current_player && gameState.game_started && (
                                            <span className="status-light current-turn-light"></span> // Removed 'status-light' class here as it's not needed for this specific light
                                        )}                                            
                                        {player.name}
                                        {player.id === playerId && " (You)"}
                                        {gameState.host_id === player.id && " (Host)"}
                                    </span>
                            </div>
                            <span className="player-hand-size">Cards: {player.hand_size}</span>
                            {gameState.game_started && player.rank !== null && (
                                <span className="player-rank">Rank: {player.rank}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>            
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // This will override any isMobile prop already on the child
                    // ensuring it gets the most up-to-date value from App.js -> GamePage
                    return React.cloneElement(child, { isMobile: isMobile });
                }
                return child;
            })}

            {error && <p className="error-message">{error}</p>}

        </div>
    );
};

export default GamePage;