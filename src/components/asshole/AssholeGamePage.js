import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useGame } from "../../contexts/GameContext";
import './AssholeGamePage.css';
import Hand from "../hands/Hand";

function AssholeGamePage() {
    const { roomCode: paramRoomCode, gameType } = useParams();
    const location = useLocation();
     const playerIdFromLocationState = location.state?.playerId;

    // Retrieve state from navigation if available, otherwise fallback to context
    const initialRoomCode = location.state?.roomCode || paramRoomCode;
    const initialPlayerId = location.state?.playerId; // Only rely on this for initial load

    const navigate = useNavigate();
    const {
        roomCode, setRoomCode,
        playerId, setPlayerId, // Still need these to update global state
        gameState, setGameState,
        getGameState,
        error, setError // Assuming you have these for error handling
    } = useGame();
    const [localRoomCode, setLocalRoomCode] = useState(initialRoomCode);
    const [localPlayerId, setLocalPlayerId] = useState(initialPlayerId);
    const playerName = location.state?.playerName;
    // Use a ref to store the interval ID
    const intervalRef = useRef(null); // Import useRef from 'react'

    // This state is crucial for controlling initial render
    const [isLoadingPage, setIsLoadingPage] = useState(true); // Renamed from 'loading' for clarity

    const [selectedCards, setSelectedCards] = useState([]);
    const [minPlayersRequired, setMinPlayersRequired] = useState(0);
    const [maxPlayersAllowed, setMaxPlayersAllowed] = useState(0);

    const yourHand = gameState?.your_hand || [];
    const isHost = gameState?.host_id === playerId;

    // --- CRITICAL DEBUGGING LOGS ---
    useEffect(() => {
        console.groupCollapsed("DEBUG: AssholeGamePage - GameState Update");
        console.log("Full gameState received:", gameState);
        console.log("Current playerId:", playerId);
        console.log("Is current player the host?", isHost);

        if (gameState) {
            console.log("gameState.game_started:", gameState.game_started);
            console.log("gameState.current_player_id:", gameState.current_player_id);
            console.log("gameState.game_message:", gameState.game_message);
            console.log("gameState.players:", gameState.players);
        } else {
            console.log("gameState is null or undefined.");
        }
        console.groupEnd();
    }, [gameState, playerId, isHost]); // Re-run when gameState or player context changes
    // --- END DEBUGGING LOGS ---

    const handleCardClick = (clickedCard) => {
        if (!clickedCard || !clickedCard.id || typeof clickedCard.id !== 'string') {
            console.error("  ERROR: Clicked card does not have a valid string 'id' property:", clickedCard);
            console.groupEnd();
            return;
        }
        const isSelected = selectedCards.some(
            (c) => {
                const comparisonResult = c.id === clickedCard.id;
                return comparisonResult;
            }
        );
        console.log(`  Is card already selected? ${isSelected}`);

        setSelectedCards(prevSelected => {
            let newState;
            if (isSelected) {
                newState = prevSelected.filter((c) => c.id !== clickedCard.id);
            } else {
                // Ensure we are adding the *full clickedCard object* with its ID
                newState = [...prevSelected, clickedCard];
            }
            return newState;
        });
    };
    
/*     useEffect(() => {
        const fetchGameData = async () => {
            console.groupCollapsed("DEBUG: AssholeGamePage - fetchGameData (Polling)"); // Start a collapsible group
            console.log(`Fetching game state for room: ${paramRoomCode}, player: ${playerIdFromLocationState}`); // Add this log
            if (!paramRoomCode || !playerIdFromLocationState) {
                console.error("Cannot fetch game state: roomCode or playerId is missing.");
                setError("Cannot fetch game state: Missing room ID or player ID.");
                return;
            }
            const result = await getGameState(paramRoomCode, playerIdFromLocationState, gameType);
            console.log("  Result from getGameState (from context):", result); // What did getGameState return?
            if (result && result.success) {
                setLoading(false)
            } else if (result) {
                console.error("API Error:", result.message || result.error); // Log API error
                setError(result.message || result.error || 'Failed to fetch game state.');
            } else {
                console.error("Failed to fetch game state: No response from API.");
                setError('Failed to fetch game state: Network or unknown error.');
            }
        };

        // Fetch immediately on mount
        fetchGameData();

        // Set up polling (adjust interval as needed)
        // Clear existing interval if component re-renders quickly
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(fetchGameData, 3000); // Poll every 3 seconds

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [localRoomCode, localPlayerId, gameType, getGameState, setGameState, setError]); */

    useEffect(() => {
        // Only update context if we have new values from navigation
        if (initialRoomCode && initialRoomCode !== roomCode) {
            setRoomCode(initialRoomCode);
        }
        if (initialPlayerId && initialPlayerId !== playerId) {
            setPlayerId(initialPlayerId); // Update context state
        }
        if (gameState) {
            if (gameState.MIN_PLAYERS !== undefined) {
                setMinPlayersRequired(gameState.MIN_PLAYERS);
            }
            if (gameState.MAX_PLAYERS !== undefined) {
                setMaxPlayersAllowed(gameState.MAX_PLAYERS);
            }
            // Ensure isLoadingPage is false if gameState comes in later for some reason
            if (isLoadingPage) setIsLoadingPage(false);
        }
    }, [initialRoomCode, initialPlayerId, roomCode, playerId, setRoomCode, setPlayerId, gameState, isLoadingPage]);

    const handleStartGame = async (event) => {
        event.preventDefault();
        setError('');
        setIsLoadingPage(true);

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
            } else {
                setError(data.error || 'Failed to start game.');
                console.error('Start game API error:', data);
            }
        } catch (error) {
            setError('Network error: Could not connect to game server to start game.');
            console.error('Start game network error:', error);
        } finally {
            setIsLoadingPage(false);
        }
        

    };

    const handlePlayCards = async () => {
        setError('');
        setIsLoadingPage(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/play_cards', {
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
            } else {
                setError(data.error || 'Failed to play cards.');
            }
        } catch (err) {
            setError('Network error playing cards.');
        } finally {
            setIsLoadingPage(false);
        }
    };

    const handlePassTurn = async () => {
        setError('');
        setIsLoadingPage(true);
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
            } else {
                setError(data.error || 'Failed to pass turn.');
            }
        } catch (err) {
            setError('Network error passing turn.');
        } finally {
            setIsLoadingPage(false);
        }
    };

    if (isLoadingPage && !gameState) {
        return <div className="asshole-game-page"><p>Loading game...</p></div>
    }

    if (error && !gameState) {
        return <div className="asshole-game-page"><p className="error-message">{error}</p></div>
    }

    if (!gameState) {
        return <div className="asshole-game-page"><p>No game data available.</p></div>
    }

        // --- CRITICAL: Conditional Rendering ---
    // If the page is still loading or gameState is not yet available, show a loading message
    if (isLoadingPage || !gameState || !gameState.all_players_data) { // Ensure all_players_data also exists
        return (
            <div className="asshole-game-page">
                <p>Loading game data...</p>
                {error && <p className="error-message">{error}</p>}
            </div>
        );
    }

    const currentPlayersInRoom = gameState.num_active_players || [];
    const pileCards = gameState.pile || [];
    const rankings = gameState.rankings || {};

    // Derived state for convenience
    const currentTurnPlayerId = gameState?.current_turn_player_id;
    const allPlayersData = gameState?.all_players_data || []; // Use correct backend field name for players array
    const currentPlayerName = allPlayersData.find(p => p.id === currentTurnPlayerId)?.name;
    const isYourTurn = gameState && gameState.current_player === playerName;
    const canStartGame = !gameState.game_started && currentPlayersInRoom >= minPlayersRequired;

    return (
        <div className="asshole-game-page">
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
            <div className="game-top-bar">
                {/* Action Buttons (PLAY, PASS, Leave/Delete Room) */}
                <div className="game-board-actions">
                    {/* Action Buttons */}
                    {/* ... (Play Card, Pass Turn buttons) ... */}
                    {/* Your hand and action buttons */}
                    {gameState.game_started && ( // Only show hand and actions if game started
                        <div className="player-turn-actions">
                            <button
                                onClick={handlePlayCards} // You'll need to create this handler
                                className="button primary-action play-button"
                                disabled={!isYourTurn || selectedCards.length === 0 || isLoadingPage}
                            >
                                PLAY
                            </button>
                            <button
                                onClick={handlePassTurn} // You'll need to create this handler
                                className="button primary-action pass-button"
                                disabled={!isYourTurn || pileCards.length === 0 || isLoadingPage} // Can't pass on empty pile
                            >
                                PASS
                            </button>
                        </div>
                    )}
                </div>
            </div> {/* END game-top-bar */}
            <h4 className="game-message">{isYourTurn ? "(YOUR TURN)" : "(Waiting for " + (currentPlayerName || 'players') + ")"}</h4>
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
                    <button disabled={canStartGame ? '' : 'disabled'} onClick={handleStartGame} className="start-game-button">
                        Start Game ({gameState.all_players_data.length}/{minPlayersRequired} players)
                    </button>
                )}
                {!gameState.game_started && !isHost && (
                    <p className="waiting-message">Waiting for host to start the game ({gameState.all_players_data.length}/{minPlayersRequired} players)</p>
                )}
                </div>
            )}


                {/* Player hand */}
                {gameState.game_started && ( // Only show hand and actions if game started
                    <div>
                        {playerId && yourHand.length > 0 && (
                            <Hand 
                                cards={yourHand}
                                onCardClick={handleCardClick}
                                selectedCards={selectedCards}
                            />
                        )}
                    </div>
                )}      
        </div>
    );
}

export default AssholeGamePage;