import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useGame } from "../../../contexts/GameContext";

import './AssholeGamePage.css';
import Hand from "../../game-ui/hands/Hand";
import Card from "../../game-ui/cards/Card";

const AssholeGamePage = ({ isMobile }) => {
    const {
        roomCode, playerId,
        gameState,
        startGame,
        playCards,
        passTurn,
        error,
        isLoadingGame,
    } = useGame();

    const [selectedCards, setSelectedCards] = useState([]);

    const yourHand = gameState?.your_hand || [];
    const pileCards = gameState?.pile || [];
    const currentTurnPlayerId = gameState?.current_turn_player_id;
    const allPlayersData = gameState?.all_players_data || [];
    const isYourTurn = gameState && currentTurnPlayerId === playerId;
    const isHost = gameState?.host_id === playerId;
    const canStartGame = !gameState?.game_started && (allPlayersData.length) >= (gameState?.MIN_PLAYERS || 0);

    const opponentHands = allPlayersData
        .filter(player => player.id !== playerId)
        .sort((a, b) => a.name.localeCompare(b.name)); // Example sort by name

    const handleCardClick = useCallback((clickedCard) => {
        setSelectedCards(prevSelected => {
            const isAlreadySelected = prevSelected.some(card => card.id === clickedCard.id);
            if (isAlreadySelected) {
                return prevSelected.filter(card => card.id !== clickedCard.id);
            } else {
                // Optional: Add logic to only select cards of the same rank for playing a set
                // if (prevSelected.length > 0 && clickedCard.rank !== prevSelected[0].rank) {
                //     alert("You can only select cards of the same rank for a play.");
                //     return prevSelected;
                // }
                return [...prevSelected, clickedCard];
            }
        });
    }, []);

    const handlePlayCards = async () => {
        if (selectedCards.length === 0) {
            alert("Please select cards to play.");
            return;
        }
        if (!isYourTurn) {
            alert("It's not your turn!");
            return;
        }
        const result = await playCards(selectedCards);
        if (result.success) {
            setSelectedCards([]);
        } else {
            // Error handling is managed by GameContext, and potentially displayed by GamePage
            // For game-specific errors, you might set a local error state here if needed
        }
    };

    const handlePassTurn = async () => {
        if (!isYourTurn) {
            alert("It's not your turn to pass!");
            return;
        }
        await passTurn();
    };

    const handleStartGame = async () => {
        if (!isHost) {
            alert("Only the host can start the game.");
            return;
        }
        if (allPlayersData.length < (gameState?.MIN_PLAYERS || 0)) {
            alert(`Need at least ${gameState.MIN_PLAYERS} players to start.`);
            return;
        }
        await startGame();
    };

    return (
        <div className="asshole-game-board-wrapper">
            {/* Main Game Content Area */}
            <div className="game-board-layout">
                {/* Top Players Area (Opponents) */}
                <div className="top-players" style={{ gridArea: 'top-players' }}>
                    {opponentHands.map(player => (
                        <div key={player.id} className={`opponent-display ${player.id === currentTurnPlayerId ? 'current-turn' : ''}`}>
                            <div className="opponent-info">
                                <span className="opponent-name">{player.name}</span>
                                <span className="opponent-cards-count">{player.hand_size} cards</span>
                            </div>
                            <div className="opponent-cards">
                                {Array.from({ length: player.hand_size }).map((_, i) => (
                                    // Render a generic face-down card for each card in opponent's hand
                                    <Card key={`${player.id}-card-${i}`} isFaceDown={true} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Play Area (Pile, Last Played Cards) */}
                <div className="main-area" style={{ gridArea: 'main-area' }}>
                    {/* Pile Area */}
                    <div className="pile-area">
                        {pileCards.length > 0 ? (
                            <>
                                <h4>Current Pile</h4>
                                <div className="pile-cards-display">
                                    {/* Display up to the last 4 cards on the pile for visibility */}
                                    {pileCards.slice(-4).map((cardObject, index) => (
                                        <Card
                                            key={cardObject.id || `${cardObject.rank}-${cardObject.suit}-${index}`}
                                            rank={cardObject.rank}
                                            suit={cardObject.suit}
                                            isFaceUp={true} // Pile cards are always face up
                                        />
                                    ))}
                                </div>
                                <p className="pile-info">
                                    Play: {gameState.current_play_count || 0} of {gameState.current_play_rank || 'N/A'}
                                </p>
                            </>
                        ) : (
                            <p className="no-pile-message">No cards on the pile. Lead a new round!</p>
                        )}
                    </div>
                </div>

                {/* Left/Right Side Players (Currently commented out in your structure, but grid areas are reserved) */}
                {/* <div className="left-side" style={{ gridArea: 'left-side' }}></div> */}
                {/* <div className="right-side" style={{ gridArea: 'right-side' }}></div> */}

                {/* Player Hand Area (Bottom) with Hand component */}
                <div className="player-hand-area" style={{ gridArea: 'player-hand' }}>
                    <Hand
                        cards={yourHand}
                        onCardClick={handleCardClick}
                        selectedCards={selectedCards}
                        isMobile={isMobile} // Pass isMobile from GamePage
                    />
                </div>

                {/* Controls Area (Play/Pass) */}
                <div className="controls-area" style={{ gridArea: 'controls' }}>
                    <div className="game-board-actions">
                        {gameState?.game_started && (
                            <div className="player-turn-actions">
                                <button
                                    onClick={handlePlayCards}
                                    className="button primary-action play-button"
                                    disabled={!isYourTurn || selectedCards.length === 0 || isLoadingGame}
                                >
                                    PLAY ({selectedCards.length})
                                </button>
                                <button
                                    onClick={handlePassTurn}
                                    className="button primary-action pass-button"
                                    disabled={!isYourTurn || pileCards.length === 0 || isLoadingGame}
                                >
                                    PASS
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Start Game Button (outside the main grid, positioned below) */}
            {!gameState?.game_started && isHost && (
                <div className="start-game-button-container">
                    <button
                        onClick={handleStartGame}
                        disabled={!canStartGame || isLoadingGame}
                        className="button start-game-button"
                    >
                        Start Game ({allPlayersData.length}/{(gameState?.MIN_PLAYERS || 0)} players)
                    </button>
                </div>
            )}

            {/* Error message (from context) */}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}
export default AssholeGamePage;