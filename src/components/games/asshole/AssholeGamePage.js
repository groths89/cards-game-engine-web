import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useGame } from "../../../contexts/GameContext";

import './AssholeGamePage.css';
import Hand from "../../game-ui/hands/Hand";
import Card, { getRankDisplay } from "../../game-ui/cards/Card";
import api from "../../../api";

const AssholeGamePage = ({ isMobile }) => {
    const {
        socket,
        roomCode, 
        playerId,
        playerName,
        gameState,
        isHost,
        startGame,
        playCards,
        passTurn,
        submitInterruptBid,
        error,
        isLoadingGame,
        chatHistory,
        setChatHistory,
    } = useGame();

    const [selectedCards, setSelectedCards] = useState([]);

    const yourHand = gameState?.your_hand || [];

    // Get current pile cards and the new backend flag
    const pileCards = gameState?.pile || [];
    const pileClearedThisTurn = gameState?.pile_cleared_this_turn || false;

    const currentTurnPlayerId = gameState?.current_turn_player_id;
    const allPlayersData = gameState?.all_players_data || [];
    

    
    const canStartGame = !gameState?.game_started && (allPlayersData.length) >= (gameState?.MIN_PLAYERS || 0);

    const gameMessage = gameState?.game_message || "";

    const interruptActive = gameState?.interrupt_active || false;
    const interruptType = gameState?.interrupt_type || null;
    const interruptInitiatorPlayerId = gameState?.interrupt_initiator_player_id || null;
    const interruptRank = gameState?.interrupt_rank || null;
    const interruptBids = gameState?.interrupt_bids || [];
    const interruptActiveUntil = gameState?.interrupt_active_until || null; // Unix timestamp
    const playersRespondedToInterrupt = useMemo(() => new Set(gameState?.players_responded_to_interrupt || []), [gameState?.players_responded_to_interrupt]);
    
    const isYourTurn = gameState && currentTurnPlayerId === playerId;
    const isInterruptInitiator = interruptInitiatorPlayerId === playerId;
    
    const [timeLeft, setTimeLeft] = useState(0);

    // States for animation
    const [animatingClearCards, setAnimatingClearCards] = useState([]);
    const [isClearingAnimationActive, setIsClearingAnimationActive] = useState(false);
    const prevPileCardsRef = useRef([]);

    useEffect(() => {
        prevPileCardsRef.current = pileCards;
    }, [pileCards]);

    useEffect(() => {
        const pileWasNotEmpty = prevPileCardsRef.current.length > 0;
        const pileIsNowEmpty = pileCards.length === 0;

        if (pileWasNotEmpty && pileIsNowEmpty && pileClearedThisTurn) {
            setAnimatingClearCards(prevPileCardsRef.current);
            setIsClearingAnimationActive(true);

            const animationDuration = 600;
            const timer = setTimeout(() => {
                setIsClearingAnimationActive(false);
                setAnimatingClearCards([]);
            }, animationDuration);

            return () => clearTimeout(timer);
        }
    }, [pileCards, pileClearedThisTurn]);

    useEffect(() => {
        let timerInterval;
        if (interruptActive && interruptActiveUntil) {
            timerInterval = setInterval(() => {
                const now = Date.now() / 1000;
                const remaining = interruptActiveUntil - now;
                setTimeLeft(Math.max(0, Math.floor(remaining)));
                if (remaining <= 0) {
                    clearInterval(timerInterval);
                }
            }, 1000);
        } else {
            setTimeLeft(0);
        }

        return () => clearInterval(timerInterval);
    }, [interruptActive, interruptActiveUntil]);

    const opponentHands = allPlayersData
        .filter(player => player.id !== playerId)
        .sort((a, b) => a.name.localeCompare(b.name));

    const getPlayerNameById = useCallback((id) => {
        return allPlayersData.find(p => p.id === id)?.name || `Player ${id.substring(0, 4)}`;
    }, [allPlayersData]);

    const handleCardClick = useCallback((clickedCard) => {
        setSelectedCards(prevSelected => {
            const isAlreadySelected = prevSelected.some(card => card.id === clickedCard.id);
            if (interruptActive && interruptType === 'three_play') {
                // If 3-play interrupt is active, only allow selecting 3s
                if (clickedCard.numeric_rank !== 3) {
                    alert("During a 3-play interrupt, you can only select 3s."); // Use custom modal
                    console.log(clickedCard);
                    return prevSelected;
                } 
                // If it's a 3 and already selected, deselect; otherwise, select
                if (isAlreadySelected) {
                    return prevSelected.filter(card => card.id !== clickedCard.id);
                } else {
                    return [...prevSelected, clickedCard];
                }
            } else if (interruptActive && interruptType === 'bomb_opportunity') {
                 if (prevSelected.length > 0 && clickedCard.numeric_rank !== prevSelected[0].numeric_rank) {
                    alert("To make a bomb interrupt, you must select cards of the same rank.");
                    return prevSelected;
                 }
                 if (isAlreadySelected) {
                     return prevSelected.filter(card => card.id !== clickedCard.id);
                 } else {
                     return [...prevSelected, clickedCard];
                 }

            } else {
                // Normal play: allow selecting any card, with optional same-rank check
                if (isAlreadySelected) {
                    return prevSelected.filter(card => card.id !== clickedCard.id);
                } else {
                    if (prevSelected.length > 0 && clickedCard.numeric_rank !== prevSelected[0].numeric_rank) {
                        alert("For a normal play, you can only select cards of the same rank.");
                        return prevSelected;
                    }
                    return [...prevSelected, clickedCard];
                }
            }
        });
    }, [interruptActive, interruptType]);

    const handlePlayCards = async () => {
        if (selectedCards.length === 0) {
            alert("Please select cards to play.");
            return;
        }
        if (!isYourTurn) {
            alert("It's not your turn!");
            return;
        }
        if (interruptActive) {
            alert("An interrupt is active. You cannot make a regular play now.");
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
        if (interruptActive) {
            alert("An interrupt is active. You cannot pass now.");
            return;
        }
        await passTurn();
    };

    const handleInterruptAction = useCallback(async (isPassing) => {
        if (!interruptActive) {
            alert("No interrupt is active.");
            return;
        }
        if (playersRespondedToInterrupt.has(playerId)) {
            alert("You have already responded to this interrupt.");
            return;
        }
        if (isInterruptInitiator) {
            alert("You initiated this interrupt and cannot bid on it.");
            return;
        }

    let cardsToSubmit = [];
    if (!isPassing) {
        cardsToSubmit = selectedCards;
        if (cardsToSubmit.length === 0) {
            alert("Please select cards to bid with, or pass.");
            return;
        }

        // Logic for 'three_play' remains unchanged
        if (interruptType === 'three_play') {
            if (!cardsToSubmit.every(card => card.numeric_rank === 3)) {
                console.log(cardsToSubmit.every(card => card.numeric_rank === 3))
                return;
            }
        }
        // Logic for 'bomb_opportunity' needs to be adjusted
        if (interruptType === 'bomb_opportunity') {
            // Check if the number of cards is between 1 and 3
            if (cardsToSubmit.length < 1 || cardsToSubmit.length > 3) {
                alert("For a bomb opportunity, you must play 1, 2, or 3 cards.");
                return;
            }
            // Check if all selected cards are of the correct rank
            if (!cardsToSubmit.every(card => card.numeric_rank === interruptRank)) {
                alert(`All selected cards must be of rank ${getRankDisplay(interruptRank)}.`);
                return;
            }
            // Ensure all selected cards are of the same rank (redundant if checking interruptRank, but good for clarity)
            if (!cardsToSubmit.every(card => card.numeric_rank === cardsToSubmit[0].numeric_rank)) {
                alert("All selected cards must be of the same rank.");
                return;
            }
        }
    }

    try {
        const response = await api.submitInterruptBid(
            roomCode,
            playerId,
            cardsToSubmit,
            interruptType,
            interruptRank 
        );

        if (response.success) {
            console.log("Interrupt bid submitted successfully:", response.message);
            setSelectedCards([]);
        } else {
            alert(response.error || "Failed to submit bid.");
        }
    } catch (error) {
        console.error("Error submitting interrupt bid:", error);
        alert(error.message || "Failed to submit bid.");
    }
    }, [roomCode, interruptActive, interruptType, interruptRank, playersRespondedToInterrupt, playerId, isInterruptInitiator, selectedCards]);

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
                {!isMobile && (
                    {/* Top Players Area (Opponents) */},
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
                )}


                {/* Main Play Area (Pile, Last Played Cards) */}
                <div className="main-area" style={{ gridArea: 'main-area' }}>
                    {/* Pile Area */}
                    <div className="pile-area">
                        {isClearingAnimationActive && (
                            <div className="animating-pile-clear">
                                {animatingClearCards.slice(-4).map((cardObject, index) => {
                                    const randomX = (Math.random() - 0.5) * 400; // -200px to +200px horizontal spread
                                    const randomY = (Math.random() - 0.5) * 300; // -150px to +150px vertical spread
                                    const randomRotate = (Math.random() - 0.5) * 720; // -360deg to +360deg rotation

                                    return (
                                        <Card
                                            key={`animating-${cardObject.id || `${cardObject.rank}-${cardObject.suit}-${index}`}`}
                                            rank={cardObject.rank}
                                            suit={cardObject.suit}
                                            isFaceUp={true}
                                            className="card-clear-animation"
                                            style={{
                                                animationDelay: `${index * 80}ms`,
                                                '--end-x': `${randomX}px`,
                                                '--end-y': `${randomY}px`,
                                                '--end-rotate': `${randomRotate}deg`,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* Render the actual pile cards ONLY when animation is NOT active */}
                        {!isClearingAnimationActive && (pileCards.length > 0 ? (
                            <>
                                <h4>Current Pile</h4>
                                <div className="pile-cards-display">
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
                        ))}
                    </div>
                
                    {interruptActive && (
                        <div className="interrupt-overlay">
                            <h3>{interruptType === 'three_play' ? '3-Play Interrupt!' : 'Bomb Opportunity!'}</h3>
                            <p>{gameState?.game_message}</p>
                            <p>Time Left: {timeLeft}s</p>
                            
                            {/* Display current bids */}
                            {interruptBids.length > 0 && (
                                <div className="current-interrupt-bids">
                                    <h4>Current Bids:</h4>
                                    <ul>
                                        {interruptBids.map((bid, idx) => (
                                            <li key={idx}>
                                                {getPlayerNameById(bid.player_id)}: {bid.cards.length} x {bid.cards[0]?.rank_display || bid.cards[0]?.rank}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Display who has responded */}
                            {gameState?.players && gameState.players.length > 1 && (
                                <p>Responded: {Array.from(playersRespondedToInterrupt).map(id => getPlayerNameById(id)).join(', ')}</p>
                            )}

                            {/* Interrupt Action Buttons (only for players who can respond) */}
                            {
                                // Show these buttons IF:
                                // 1. An interrupt is active
                                // 2. The current player HAS NOT already responded
                                // 3. The current player IS NOT the one who initiated the interrupt
                                interruptActive && 
                                !playersRespondedToInterrupt.has(playerId) && 
                                !isInterruptInitiator && (
                                <div className="interrupt-actions">
                                    <button
                                        onClick={() => handleInterruptAction(false)}
                                        className="button primary-action"
                                        disabled={isLoadingGame || selectedCards.length === 0}
                                    >
                                        Bid ({selectedCards.length})
                                    </button>
                                    <button
                                        onClick={() => handleInterruptAction(true)}
                                        className="button secondary-action"
                                        disabled={isLoadingGame}
                                    >
                                        Pass Interrupt
                                    </button>
                                </div>
                            )}
                        </div>
                    )}                
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

                {/* Controls Area (Play/Pass/Interrupt) */}
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