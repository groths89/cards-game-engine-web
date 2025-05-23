import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import './AssholeGamePage.css';

function AssholeGamePage() {
    const { gameType, roomCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const playerId = location.state?.playerId;
    const playerName = location.state?.playerName;

    const [gameState, setGameState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCards, setSelectedCards] = useState([]);
    const [minPlayersRequired, setMinPlayersRequired] = useState(0);
    const [maxPlayersAllowed, setMaxPlayersAllowed] = useState(0);

    const isHost = gameState?.host_id === playerId;
    
    const fetchGameState = useCallback(async () => {
        if (!roomCode || !playerId || !gameType) {
            setError("Missing game type, room code, or player ID. Please join a game first.");
            setLoading(false);
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/game_state?room_code=${roomCode}&player_id=${playerId}&game_type=${gameType}`);
            const data = await response.json();

            if (response.ok) {
                setGameState(data);
                setMinPlayersRequired(data.MIN_PLAYERS || 0);
                setMaxPlayersAllowed(data.MAX_PLAYERS || 0);
            } else {
                setError(data.error || 'Failed to fetch game state.');
                console.error('API Error:', data);
                if (response.status === 404) {
                    setError("Game room not found or no longer exists. Returning to lobby.");
                    setTimeout(() => navigate('/lobby'), 3000); // Navigate after a delay
                }
            }
        } catch (apiError) {
            setError('Network Error. Could not connect to the game server.');
            console.error('Network Error:', apiError);
        } finally {
            setLoading(false);
        }
    }, [roomCode, playerId, gameType, navigate]);

    // Add this useEffect to log values when they change
    useEffect(() => {
        console.log("--- AssholeGamePage Debug ---");
        console.log("Current Frontend Player ID:", playerId);
        console.log("Game State Host ID (from backend):", gameState?.host_id);
        console.log("Is Current Player The Host (frontend calculation):", isHost);
        console.log("Room Code:", roomCode);
        console.log("--- End Debug ---");
    }, [playerId, gameState, isHost, roomCode]); // Add dependencies

    useEffect(() => {
        fetchGameState();
        const interval = setInterval(fetchGameState, 2000);
        return () => clearInterval(interval);
    }, [fetchGameState]);

    const handleLeaveRoom = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/leave_room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ room_code: roomCode, player_id: playerId }),
            });
            const data = await response.json();

            if (response.ok) {
                console.log('Left room successfully:', data.message);
                navigate('/lobby'); // Navigate back to the lobby after leaving
            } else {
                setError(data.error || 'Failed to leave room.');
                console.error('Leave Room API Error:', data);
            }            
        } catch (apiError) {
            setError('Network error. Could not leave room.');
            console.error('Network Error leaving room:', apiError);
        }
    }

    const handleDeleteRoom = async () => {
        if (!window.confirm("Are you sure you want to delete this room? This cannot be undone.")) {
            return; // User cancelled
        }
        try {
            const response = await fetch('http://127.0.0.1:5000/delete_room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ room_code: roomCode, player_id: playerId }),
            });
            const data = await response.json();

            if (response.ok) {
                console.log('Room deleted successfully:', data.message);
                navigate('/lobby'); // Navigate back to the lobby after deletion
            } else {
                setError(data.error || 'Failed to delete room.');
                console.error('Delete Room API Error:', data);
            }
        } catch (apiError) {
            setError('Network error. Could not delete room.');
            console.error('Network Error deleting room:', apiError);
        }
    };

    const handleStartGame = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:5000/start_game_round', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    room_code: roomCode,
                    player_id: playerId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Game start successful:', data.message);
                await fetchGameState();
            } else {
                setError(data.error || 'Failed to start game.');
                console.error('Start game API error:', data);
            }
        } catch (error) {
            setError('Network error: Could not connect to game server to start game.');
            console.error('Start game network error:', error);
        } finally {
            setLoading(false);
        }
        

    };

    // --- Placeholder for other game actions ---
    const toggleCardSelection = (cardStr) => {
        setSelectedCards(prev =>
            prev.includes(cardStr) ? prev.filter(c => c !== cardStr) : [...prev, cardStr]
        );
    };

    const handlePlayCards = async () => {
        setError('');
        setLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/play_card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_code: roomCode,
                    player_id: playerId,
                    cards: selectedCards
                })
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Cards played:', data.message);
                setSelectedCards([]); // Clear selection
                await fetchGameState(); // Refresh game state
            } else {
                setError(data.error || 'Failed to play cards.');
            }
        } catch (err) {
            setError('Network error playing cards.');
        } finally {
            setLoading(false);
        }
    };

    const handlePassTurn = async () => {
        setError('');
        setLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/pass_turn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_code: roomCode,
                    player_id: playerId
                })
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Turn passed:', data.message);
                await fetchGameState(); // Refresh game state
            } else {
                setError(data.error || 'Failed to pass turn.');
            }
        } catch (err) {
            setError('Network error passing turn.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !gameState) {
        return <div className="asshole-game-page"><p>Loading game...</p></div>
    }

    if (error && !gameState) {
        return <div className="asshole-game-page"><p className="error-message">{error}</p></div>
    }

    if (!gameState) {
        return <div className="asshole-game-page"><p>No game data available.</p></div>
    }

    const currentPlayersInRoom = gameState.all_players_data || [];
    const yourHand = gameState.your_hand || [];
    const pileCards = gameState.pile || [];
    const rankings = gameState.rankings || {};

    // Derived state for convenience
    const isYourTurn = gameState && gameState.current_player === playerName;
    const canStartGame = !gameState.game_started && currentPlayersInRoom.length >= minPlayersRequired;

    return (
        <div className="asshole-game-page">
            {/* Room Code top-right */}
            <div className="room-code-display">
                Room Code: <strong>{roomCode}</strong>
            </div>

            {/* Lobby Status section top-left */}
            <div className="lobby-status-section">
                <h4>Lobby Status</h4>
                <div className="lobby-status-grid">
                    <div className="lobby-status-row">
                        <span className="lobby-label">Current:</span>
                        <div className="status-indicator-group">
                            <span className={`status-light ${currentPlayersInRoom.length >= minPlayersRequired ? 'active' : 'inactive'}`}></span>
                            <span className="status-value">{currentPlayersInRoom.length}</span>
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

            {/* Player Status Sidebar (Vertical List) - unchanged */}
            {/* This is where player names, hand sizes, and potentially host status will be shown */}
            <div className="player-status-sidebar">
                {/* Iterating over all_players_data from gameState */}
                {gameState.all_players_data && gameState.all_players_data.length > 0 ? (
                    <div className="player-list-grid"> {/* Apply grid for player list */}
                        {gameState.all_players_data.map(player => (
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
                ) : (
                    <p>No players in room.</p>
                )}
            </div>

            <h2>{gameType.toUpperCase()} Game Board</h2>
            <h4>{isYourTurn ? "(YOUR TURN)" : "(Waiting for " + (gameState.current_player || 'players') + ")"}</h4>
            <div className="pile-area">
                {pileCards.length > 0 ? (
                    pileCards.slice(-4).map((cardStr, index) => ( // Show last few cards on pile
                        <div key={index} className="card-image no-image">{cardStr}</div>
                        // Or, if you have card images:
                        // <img key={index} src={`/path/to/card/images/${cardStr}.png`} alt={cardStr} className="card-image" />
                        ))
                    ) : (
                        <p>Pile is empty. Lead a new round!</p>
                )}
            </div>

            {/* Start Game Button (Conditionally render) */}
            {!gameState.game_started && (
                <div className="start-game-button-container">
                {!gameState.game_started && isHost && (
                    <button onClick={handleStartGame} className="start-game-button">
                        Start Game ({gameState.all_players_data.length}/{minPlayersRequired} players)
                    </button>
                )}
                {!gameState.game_started && !isHost && (
                    <p className="waiting-message">Waiting for host to start the game ({gameState.all_players_data.length}/{minPlayersRequired} players)</p>
                )}
                </div>
            )}


                {/* Action Buttons */}
                <div className="game-action-buttons">
                    {/* ... (Play Card, Pass Turn buttons) ... */}
                    {/* Your hand and action buttons */}
                    {gameState.is_game_started && ( // Only show hand and actions if game started
                        <div className="your-hand-container">
                            <h3>Your Hand ({yourHand.length} cards)</h3>
                            <div className="player-hand">
                                {/* Map over gameState.your_hand to render card-image for each */}
                                {yourHand.map((cardStr, index) => (
                                    <div
                                        key={index}
                                        className={`card-image ${selectedCards.includes(cardStr) ? 'selected' : ''}`}
                                        onClick={() => toggleCardSelection(cardStr)}
                                    >
                                        {cardStr} {/* For now, display card string */}
                                        {/* If you have images, use <img> here */}
                                    </div>
                                ))}
                            </div>
                            <div className="action-buttons">
                                <button
                                    onClick={handlePlayCards} // You'll need to create this handler
                                    className="play-button"
                                    disabled={!isYourTurn || selectedCards.length === 0 || loading}
                                >
                                    PLAY
                                </button>
                                <button
                                    onClick={handlePassTurn} // You'll need to create this handler
                                    className="pass-button"
                                    disabled={!isYourTurn || pileCards.length === 0 || loading} // Can't pass on empty pile
                                >
                                    PASS
                                </button>
                            </div>
                        </div>
                    )}


                    {/* NEW: Leave Room Button */}
                    <button onClick={handleLeaveRoom} className="btn btn-warning">
                        Leave Room
                    </button>

                    {/* NEW: Delete Room Button (only for host) */}
                    {isHost && (
                        <button onClick={handleDeleteRoom} className="btn btn-danger">
                            Delete Room
                        </button>
                    )}
                </div>

            {/* Rankings if game is over */}
            {gameState.is_game_over && (
                <div className="rankings-section">
                    <h3>Game Over! Final Rankings:</h3>
                    <ul className="rankings-list">
                        {Object.entries(rankings).map(([playerName, rankName]) => (
                            <li key={playerName}>
                                **{rankName}**: {playerName}
                            </li>
                        ))}
                    </ul>
                </div>
            )}            
        </div>
    );
}

export default AssholeGamePage;