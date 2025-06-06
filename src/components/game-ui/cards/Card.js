import React from "react";
import './Card.css';

// Helper function to generate an array of numbers for mapping pips
const getPipCount = (rank) => {
    switch (rank) {
        case 'A': return 1;
        case '2': return 2;
        case '3': return 3;
        case '4': return 4;
        case '5': return 5;
        case '6': return 6;
        case '7': return 7;
        case '8': return 8;
        case '9': return 9;
        case '10': return 10; // 'T' for Ten
        // For J, Q, K, you might want to use specific images or just the corner text
        default: return 0; // No central pips for face cards by default
    }
};

const Card = ({rank, suit, isSelected, onClick}) => {
    const suitColorClass = (suit === 'H' || suit === 'D') ? 'red-suit' : 'black-suit';
    const suitSymbol = {
        'C': '♣',
        'D': '♦',
        'H': '♥',
        'S': '♠'
    }[suit];

    const displayRank = rank;

    const pipCount = getPipCount(rank);

    return (
        <div className={`card ${suitColorClass} ${isSelected ? 'selected' : ''}`} onClick={onClick}>
            <div className="card-corner card-top-left">
                <span className="card-rank">{rank}</span>
                <span className="card-suit-symbol">{suitSymbol}</span>
            </div>
            <div className="card-center-pips">
                {pipCount > 0 ? (
                    // Render pips for number cards
                    Array.from({ length: pipCount }).map((_, i) => (
                        <span key={i} className="card-pip-symbol">{suitSymbol}</span>
                    ))
                ) : (
                    // For face cards (J, Q, K), you could put a larger rank or a placeholder
                    <span className="card-face-rank">{displayRank}</span>
                    // Or an image for J, Q, K
                )}
            </div>
            <div className="card-corner card-bottom-right">
                <span className="card-rank">{rank}</span>
                <span className="card-suit-symbol">{suitSymbol}</span>
            </div>
        </div>
    )
};

export default Card;