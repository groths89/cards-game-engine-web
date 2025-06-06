import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useGame } from "../../../contexts/GameContext";

import './AssholeGamePage.css';
import Hand from "../../game-ui/hands/Hand";
import Card from "../../game-ui/cards/Card";

function AssholeGamePage({isMobile}) {
    const {
        roomCode, playerId,
        gameState,
        startGame,
        playCards,
        passTurn,
        error, setError,
        isLoadingGame, setIsLoadingGame
    } = useGame();

    const [selectedCards, setSelectedCards] = useState([]);

    const yourHand = gameState?.your_hand || [];
    const pileCards = gameState?.pile || [];
    const currentTurnPlayerId = gameState?.current_turn_player_id;
    const allPlayersData = gameState?.all_players_data || [];
    const currentPlayerName = allPlayersData.find(p => p.id === currentTurnPlayerId)?.name;
    const isYourTurn = gameState && currentTurnPlayerId === playerId;
    const isHost = gameState?.host_id === playerId;
    const canStartGame = !gameState?.game_started && (allPlayersData.length || 0) >= (gameState?.MIN_PLAYERS || 0);

    const handleCardClick = useCallback((clickedCard) => {
        setSelectedCards(prevSelected => {
            const isAlreadySelected = prevSelected.some(card => card.id === clickedCard.id);
            if (isAlreadySelected) {
                return prevSelected.filter(card => card.id !== clickedCard.id);
            } else {
                return [...prevSelected, clickedCard];
            }
        });
    }, []);

    const handlePlayCards = async () => {
        // Use the context's playCards function
        await playCards(selectedCards);
        setSelectedCards([]); // Clear selected cards after attempting to play
    };

    const handlePassTurn = async () => {
        // Use the context's passTurn function
        await passTurn();
    };

    const handleStartGame = async () => {
        // Use the context's startGame function
        await startGame();
    };


    // No loading check here, as GamePage.jsx handles it
    // No room management buttons here, as GamePage.jsx handles them

    return (
        <div className="asshole-game-board-wrapper">
            {/* Main Game Content Area */}
            <div className="game-board-layout">
                {/* Top Players Area (if applicable) */}
                <div className="top-players" style={{ gridArea: 'top-players' }}>
                    {/* Render other players here */}
                </div>

                {/* Main Play Area (Pile, Last Played Cards) */}
                <div className="main-area" style={{ gridArea: 'main-area' }}>
                    {/* Pile Area */}
                    <div className="pile-area">
                        {pileCards.length > 0 ? (
                            pileCards.slice(-4).map((cardObject, index) => (
                                <Card
                                    key={cardObject.id || index}
                                    card={cardObject}
                                    isFaceUp={true}
                                />
                            ))
                        ) : (
                            <p>Pile is empty. Lead a new round!</p>
                        )}
                    </div>
                </div>

                {/* Left/Right Side Players (if applicable) */}
                {/*<div className="left-side" style={{ gridArea: 'left-side' }}></div>
                <div className="right-side" style={{ gridArea: 'right-side' }}></div>*/}

                {/* Player Hand Area (Bottom) with Hand component */}
                <div className="player-hand-area" style={{ gridArea: 'player-hand' }}>
                    <Hand
                        cards={yourHand}
                        onCardClick={handleCardClick}
                        selectedCards={selectedCards}
                        isMobile={isMobile}
                    />
                </div>

                {/* Controls Area (Play/Pass) */}
                <div className="controls-area" style={{ gridArea: 'controls' }}>
                    <div className="game-board-actions">
                        {gameState.game_started && (
                            <div className="player-turn-actions">
                                <button
                                    onClick={handlePlayCards}
                                    className="button primary-action play-button"
                                    disabled={!isYourTurn || selectedCards.length === 0 || isLoadingGame}
                                >
                                    PLAY
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

            {/* Start Game Button (if specific to Asshole, otherwise move to GamePage) */}
            {/* Keeping it here for now as it's game-specific logic (min players for *this* game) */}
            {!gameState?.game_started && isHost && (
                <div className="start-game-button-container">
                    <button onClick={handleStartGame} disabled={!canStartGame || isLoadingGame} className="start-game-button">
                        Start Game ({allPlayersData.length}/{(gameState?.MIN_PLAYERS || 0)} players)
                    </button>
                </div>
            )}

            {/* Error message is now handled by GamePage, but game-specific errors can still be displayed here if needed */}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export default AssholeGamePage;