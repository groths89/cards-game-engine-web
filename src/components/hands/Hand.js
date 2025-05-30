import React from "react";
import Card from "../cards/Card";
import './Hand.css';

const Hand = ({cards, onCardClick, selectedCards}) => {
        if (!cards || cards.length === 0) {
        return <p>Your hand is empty.</p>;
    }

    const numCards = cards.length;
    const maxRotation = 30; // Max angle for the leftmost/rightmost card in degrees
    
    const cardWidth = 150;
    const cardHeight = 210;

    const visibleCardPart = 60;
    const totalHandWidth = cardWidth + (numCards - 1) * visibleCardPart

    const arcSpreadFactor = 2.0;
    const arcHeightFactor = 0.6;
    const baseTranslateY = 0;

    return (
        <div className="player-hand-container">
            {cards.map((cardData, index) => {
                const normalizedIndex = (index - (numCards - 1) / 2) / (numCards > 1 ? (numCards - 1) / 2 : 1);
                const rotation = normalizedIndex * maxRotation;
                const translateX = normalizedIndex * (cardWidth / 2) * arcSpreadFactor;
                const translateY = baseTranslateY + Math.pow(Math.abs(normalizedIndex), 2) * cardHeight * arcHeightFactor;

                const isCardSelected = selectedCards && selectedCards.some(
                    (selectedCardObject) => selectedCardObject.id === cardData.id,
                );

                return (
                    <div
                        key={cardData.id || `${cardData.rank}-${cardData.suit}-${index}`} // Use a unique ID from cardData or fallback
                        className={`card-wrapper`}
                        style={{ 
                            transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
                            zIndex: index + 10,
                            marginLeft: index === 0 ? '0' : `-${cardWidth - visibleCardPart}px`
                        }} // Apply rotation dynamically
                        // You might also apply margin-left here if you need more dynamic overlap control
                        onClick={() => onCardClick(cardData)} // Use the passed onCardClick prop
                    >
                        {/* Render your Card component here */}
                        {/* Assuming cardData has rank and suit properties directly */}
                        <Card rank={cardData.rank} suit={cardData.suit} isFaceUp={true} isSelected={isCardSelected} />
                    </div>
                );
            })}
        </div>
    );
};

export default Hand;