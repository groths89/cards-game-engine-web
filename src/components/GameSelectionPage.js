import React from "react";
import { Link } from "react-router-dom";
import './GameSelectionPage.css';

import assholeGameImage from "../assets/asshole-thumbnail.jpg";

function GameSelectionPage() {
    return (
        <div className="game-selection-page">
            <h2>Select a Game</h2>
            <div className="game-list">
                <div className="game-card">
                    <img src={assholeGameImage} alt="Asshole Game Thumbnail" className="game-thumbnail" />
                    <div className="game-item">
                        <h3>Asshole (Presidents)</h3>
                        <p>A popular shedding-type card game where players try to get rid of all their cards as fast as possible.</p>
                        <Link to="/lobby/asshole" className="play-button">Play Now</Link>
                    </div>
                </div>
                {/* Add more game cards as they are implemented. */}
            </div>
        </div>
    );
}

export default GameSelectionPage;