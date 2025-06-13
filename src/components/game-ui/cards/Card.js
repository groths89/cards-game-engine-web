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

const SuitSVG = ({suit, colorClass}) => {
    let content;
    switch (suit) {
        case 'S':
            content = (
                <>
                    <g transform="rotate(225,300,300)" fill="currentColor">
                        <rect width="300" height="300" x="200" y="200" />
                        <circle cx="200" cy="350" r="150" />
                        <circle cx="350" cy="200" r="150" />
                    </g>

                    <path d="M300,300 Q300,500 200,600 H400 Q300,500 300,300" />
                </>
            );
            break;
        case 'H':
            content = (
                <g transform="rotate(45,300,300)" fill="currentColor">
                    <rect x="150" y="150" height="350" width="350" />
                    <circle cx="150" cy="325" r="175" />
                    <circle cx="325" cy="150" r="175" />
                </g>
            );
            break;
        case 'D':
            content = (
                <rect x="100" y="100" width="400" height="400" transform="rotate(45,300,300)" fill="currentColor" />
            );
            break;
        case 'C':
            content = (
                <>
                    <circle cx="180" cy="350" r="140" />
                    <circle cx="300" cy="150" r="140" />
                    <circle cx="420" cy="350" r="140" />
                    <path d="M300,300 Q 300,500 200,600 H400 Q300,500 300,300" />
                </>
            );
            break;
        default:
            break;
    }

    return (
        <svg viewBox="0 0 600 600" className={`${colorClass}`}>
            {content}
        </svg>  
    );
}

const Card = ({rank, suit, isFaceDown = false, isSelected, onClick}) => {
    const isRed = suit === 'H' || suit === 'D';
    const textColorClass = isRed ? 'red-suit' : 'black-suit';
    const colorVariable = isRed ? 'var(--suit-red)' : 'var(--suit-black)';
    const colorHexForPlaceholder = isRed ? 'dc2626' : '1f2937';
    const suitSymbol = {
        'C': '♣',
        'D': '♦',
        'H': '♥',
        'S': '♠'
    }[suit];

    const displayRank = {
        '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
        'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A'
    }[rank] || rank;

    if (isFaceDown) {
        return (
            <div className={`card card-face-down ${isSelected ? 'card-selected' : ''}`} onClick={onClick}>
                <div className="card-back-pattern">
                    <svg viewBox="0 0 24 24" className="card-back-symbol">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 17c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zM13 5h-2v6H5v2h6v6h2v-6h6v-2h-6V5z"/>
                    </svg>
                </div>
                <div className="card-back-gradient"></div>
                <div className="card-back-initials">GG</div>
            </div>
        );
    }

    const pipLayouts = {
        '2': ['top-middle', 'bottom-middle-rotated'],
        '3': ['top-middle', 'center-middle', 'bottom-middle-rotated'],
        '4': ['top-left', 'top-right', 'bottom-left-rotated', 'bottom-right-rotated'],
        '5': ['top-left', 'top-right', 'center-middle', 'bottom-left-rotated', 'bottom-right-rotated'],
        '6': ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left-rotated', 'bottom-right-rotated'],
        '7': ['top-left', 'top-right', 'top-center-top', 'middle-left', 'middle-right', 'bottom-left-rotated', 'bottom-right-rotated'],
        '8': ['top-left', 'top-right', 'top-center-top', 'middle-left', 'middle-right', 'bottom-center-bottom-rotated', 'bottom-left-rotated', 'bottom-right-rotated'],
        '9': ['top-left', 'top-center-top', 'top-right', 'middle-left-narrow', 'center-middle', 'middle-right-narrow', 'bottom-left-rotated', 'bottom-center-bottom-rotated', 'bottom-right-rotated'],
        '10': ['top-left', 'top-center-top', 'top-right', 'middle-left-narrow', 'middle-right-narrow', 'center-left-vertical', 'center-right-vertical', 'bottom-left-rotated', 'bottom-center-bottom-rotated', 'bottom-right-rotated'],
    };

    const renderPips = () => {
        const pipComponents = [];
        const pipCount = parseInt(rank);

        if (rank === 'A') {
            return (
                <div className="card-center-face-symbol" style={{colorVariable}}>
                    <SuitSVG suit={suit} colorClass={`card-center-suit-svg ${textColorClass}`} />
                </div>                
            );
        } else if (['J', 'Q', 'K'].includes(rank)) {
            let faceImageUrl = '';
            let altText = '';
            switch (rank) {
                case 'J':
                    faceImageUrl = `https://placehold.co/60x80/${colorHexForPlaceholder}/ffffff?text=J`;
                    altText = `Jack of ${suit}`;
                    break;
                case 'Q':
                    faceImageUrl = `https://placehold.co/60x80/${colorHexForPlaceholder}/ffffff?text=Q`;
                    altText = `Queen of ${suit}`;
                    break;
                case 'K':
                    faceImageUrl = `https://placehold.co/60x80/${colorHexForPlaceholder}/ffffff?text=K`;
                    altText = `King of ${suit}`;
                    break;
                default:
                    break;
            }
            return (
                <div className="card-center-face-image-wrapper">
                    <img 
                        src={faceImageUrl} 
                        alt={altText} 
                        className="card-center-face-image" 
                        onError="this.onerror=null;this.src='https://placehold.co/60x80/cccccc/000000?text=Error';" // Fallback
                    />
                </div>
            );            
        } else if (pipCount >= 2 || pipCount <= 10) {
            const pipClass = `card-pip-svg ${textColorClass}`;
            const Pip = ({ positionClass }) => (
            <div className={`pip-wrapper ${positionClass}`} style={{ color: colorVariable }}>
                <SuitSVG suit={suit} colorClass={pipClass} />
            </div>
            );
            
            const positions = pipLayouts[rank] || [];
            positions.forEach((pos, index) => {
                pipComponents.push(<Pip key={`${rank}-${pos}-${index}`} positionClass={`pip-position-${pos}`} />);
            });
            return pipComponents;
        }    
    };

    return (
        <div className={`card card-container ${isSelected ? 'card-selected' : ''}`} onClick={onClick}>
            <div className={`card-corner card-top-left ${textColorClass}`} style={{ color: colorVariable }}>
                <span className="card-rank">{displayRank}</span>
                <SuitSVG suit={suit} colorClass="card-corner-suit-svg" />
            </div>
            <div className="card-pip-area" style={{ color: colorVariable }}>
                {renderPips()}
            </div>
            <div className={`card-corner card-bottom-right ${textColorClass}`} style={{ color: colorVariable }}>
                <span className="card-rank">{displayRank}</span>
                <SuitSVG suit={suit} colorClass="card-corner-suit-svg card-corner-suit-svg-rotated" />
            </div>
        </div>
    )
};

export default Card;