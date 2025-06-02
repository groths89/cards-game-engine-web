import React from "react";
import { Link, useNavigate } from "react-router-dom";
import './GameSelectionPage.css';

import assholeGameImage from "../assets/asshole-thumbnail.jpg";
import genericGameImage from "../assets/generic-game-thumbnail.png";

function GameSelectionPage() {
    const navigate = useNavigate();

    const handleSelectGame = (gameType) => {
        navigate(`/lobby/${gameType}`);
    };

    return (
        <div className="game-selection-page">
            <h2>Select a Game</h2>
            <div className="game-list">
                {/* Asshole Game Card */}
                <div className="game-card">
                    <img src={assholeGameImage} alt="Asshole Game Thumbnail" className="game-thumbnail" />
                    <div className="game-details"> {/* Changed from game-item for better semantics */}
                        <h3>Asshole (Presidents)</h3>
                        <p>A popular shedding-type card game where players try to get rid of all their cards as fast as possible.</p>
                        <div className="game-options">
                            {/* This Link directly navigates to the lobby creation/joining page for "asshole" */}
                            <button
                                className="button create-game-button"
                                onClick={() => handleSelectGame('asshole')}
                            >
                                Play
                            </button>
                            {/* Placeholder buttons for future functionality */}
                            {/* 
                            <button
                                className="button create-game-button"
                                onClick={() => handleCreateGame('asshole')}
                                disabled // Disable until feature is ready
                            >
                                Create Game
                            </button>
                            <button
                                className="button join-game-button"
                                onClick={() => handleJoinGame('asshole')}
                                disabled // Disable until feature is ready
                            >
                                Join Game
                            </button> 
                            */}
                        </div>
                    </div>
                </div>

                {/* Placeholder for other games */}
                <div className="game-card coming-soon">
                    <img src={genericGameImage} alt="Coming Soon Game Thumbnail" className="game-thumbnail" />
                    <div className="game-details">
                        <h3>Another Game (Coming Soon)</h3>
                        <p>Description for another exciting game that will be available in the future!</p>
                        <div className="game-actions">
                             <button className="button" disabled>Coming Soon</button>
                        </div>
                    </div>
                </div>
                {/* Add more game cards as they are implemented. */}
            </div>
        </div>
    );
}

export default GameSelectionPage;