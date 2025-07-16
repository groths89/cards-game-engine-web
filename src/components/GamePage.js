// src/pages/GamePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import './GamePage.css';

const GamePage = ({ children, isMobile }) => {
    const {
        roomCode, playerId, isHost,
        gameState,
        fetchGameState,
        leaveRoom,
        deleteRoom,
        error,
        isLoadingGame,
    } = useGame();

    const navigate = useNavigate();
    const { gameType } = useParams();

    const [minPlayersRequired, setMinPlayersRequired] = useState(0);
    const [maxPlayersAllowed, setMaxPlayersAllowed] = useState(0);

    const handleLeaveRoom = async () => {
        if (window.confirm("Are you sure you want to leave this room?")) {
            await leaveRoom();
        }
    };

    const handleDeleteRoom = async () => {
        if (!window.confirm("Are you sure you want to delete this room? This cannot be undone.")) {
            return;
        }
        await deleteRoom();
    };

    useEffect(() => {
        if (roomCode && playerId && !gameState) {
            console.log("GamePage: Initial fetch of game state...");
            fetchGameState();
        } else if (!roomCode && !isLoadingGame) {
            console.warn("GamePage: No roomCode found or room deleted. Redirecting to home.");
            navigate('/');
        }
    }, [roomCode, playerId, gameState, fetchGameState, isLoadingGame, navigate]);


    useEffect(() => {
        if (gameState) {
            setMinPlayersRequired(gameState.MIN_PLAYERS || 0);
            setMaxPlayersAllowed(gameState.MAX_PLAYERS || 0);
        }
    }, [gameState]);

    const allPlayersData = gameState?.all_players_data || [];
    const currentPlayers = allPlayersData.length;
    const currentPlayerName = allPlayersData.find(p => p.id === gameState?.current_turn_player_id)?.name;
    const displayGameType = gameType ? gameType.charAt(0).toUpperCase() + gameType.slice(1).toLowerCase() : 'Game';

    if (isLoadingGame || !gameState || !gameState.all_players_data || !roomCode || !playerId) {
        return (
            <div className="game-page-loading">
                <p>Loading {displayGameType} game data...</p>
                {(error && !isLoadingGame) && <p className="error-message">{error}</p>} {/* Show error if not loading */}
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
                            {isHost && (
                                <button onClick={handleDeleteRoom} className="button delete-room-button">
                                    Delete Room
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isMobile && (
                <div className="game-page-top-info mobile-ui">
                    <h2 className="game-page-title-mobile">{displayGameType} Board</h2>
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
                        {isHost && (
                            <button onClick={handleDeleteRoom} className="button small-button mobile-action-button delete-button">
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="player-status-sidebar">
                <div className="player-list-grid">
                    {allPlayersData.map(player => (
                        <div key={player.id} className={`player-item ${player.id === playerId ? 'you' : ''}`}>
                            <div className="player-name-wrapper">
                                <div className="status-light-container">
                                    <span className={`status-light ${player.is_active ? 'active' : 'inactive'}`}></span>
                                </div>
                                <span className="player-name">
                                    {player.id === gameState.current_turn_player_id && gameState.game_started && (
                                        <span className="status-light current-turn-light"></span>
                                    )}  
                                    {player.name}
                                    {player.id === playerId && " (You)"}
                                    {gameState.host_id === player.id && " (Host)"}
                                </span>
                            </div>
                            <span className="player-hand-size">Cards: {player.hand_size}</span>
                            {gameState.game_started && gameState.rankings && gameState.rankings[player.id] && (
                                <span className="player-rank">Rank: {gameState.rankings[player.id].rank}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Game Messages */}
            {gameState.game_message && <p className="game-message">{gameState.game_message}</p>}

            {/* Render game-specific content passed as children */}
            {/* The child component (e.g., AssholeGamePage) will get its props from context now */}
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { isMobile: isMobile });
                }
                return child;
            })}

            {error && <p className="error-message">{error}</p>}

        </div>
    );
};

export default GamePage;