import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import './AssholeGamePage.css';

function AssholeGamePage() {
    const { gameType, roomCode } = useParams();
    const location = useLocation();
    const { playerId, playerName } = location.state || {};

    const [gameState, setGameState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCards, setSelectedCards] = useState([]);
    
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
            } else {
                setError(data.error || 'Failed to fetch game state.');
                console.error('API Error:', data);
            }
        } catch (apiError) {
            setError('Network Error. Could not connect to the game server.');
            console.error('Network Error:', apiError);
        } finally {
            setLoading(false);
        }
    }, [roomCode, playerId, gameType]);

    useEffect(() => {
        fetchGameState();
    }, [fetchGameState]);

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
                body: JSON.stringify({ room_code: roomCode}),
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
    const minPlayersRequired = gameState.MIN_PLAYERS || 4;
    const isYourTurn = gameState && gameState.current_player === playerName;
    const canStartGame = gameState && currentPlayersInRoom.length >= (minPlayersRequired || 4) && !gameState.game_started;

    return (
        <div className="asshole-game-page">
            <h2>{gameType.toUpperCase()} Game Board - Room: {roomCode}</h2>
            <h3>Playing as: {playerName || 'Guest'} (ID: {playerId})</h3>
                <div className="player-info-container">
                    {/* Map over game.all_players_data to render player-card for each */}
                    {currentPlayersInRoom.map(p => (
                        <div key={p.id} className={`player-card ${p.id === playerId ? 'current-player' : ''} ${!p.is_active ? 'inactive' : ''}`}>
                            <h4>{p.name}</h4>
                            <p>Cards: {p.hand_size}</p>
                            {p.rank && <p>Rank: {p.rankings[p.name]}</p>} {/* Display rank if available */}
                        </div>
                    ))}
                </div>
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
                    <button
                        onClick={handleStartGame} // You'll need to create this handler
                        className="start-game-button"
                        disabled={!canStartGame || loading} // Use actual MIN_PLAYERS
                    >
                        Start Game ({currentPlayersInRoom.length}/{minPlayersRequired} players)
                    </button>
                </div>
            )}

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