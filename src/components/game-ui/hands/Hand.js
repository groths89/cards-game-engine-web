import React, { useEffect, useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Card from "../cards/Card";
import './Hand.css';

const Hand = ({cards, onCardClick, selectedCards, isMobile}) => {
        console.log('Hand component rendered. isMobile prop:', isMobile);
        const handCardsScrollRef = useRef(null);

        const [showLeftArrow, setShowLeftArrow] = useState(false);
        const [showRightArrow, setShowRightArrow] = useState(false);

        const desktopCardWidth = 150;
        const desktopOverlap = 90;
        const mobileCardWidth = 100;
        const mobileOverlap = 20;

        const checkArrows = useCallback(() => {
            const currentRef = handCardsScrollRef.current;
            if (currentRef) {
                const { scrollWidth, clientWidth, scrollLeft } = currentRef;
                setShowLeftArrow(scrollLeft > 0);
                setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
            } else {
                setShowLeftArrow(false);
                setShowRightArrow(false);
            }
        });

        const scrollHand = (direction) => {
            const currentRef = handCardsScrollRef.current;
            if (currentRef) {
                const currentCardWidth = isMobile ? mobileCardWidth : desktopCardWidth;
                const currentOverlap = isMobile ? mobileOverlap : desktopOverlap;
                const scrollAmount = (currentCardWidth - currentOverlap) * 2;

                currentRef.scrollBy({
                    left: direction == 'left' ? -scrollAmount : scrollAmount,
                    behavior: 'smooth'
                });
            }
        }

        useEffect(() => {
            checkArrows();

            const currentRef = handCardsScrollRef.current;
            if (currentRef) {
                currentRef.addEventListener('scroll', checkArrows);
                const observer = new ResizeObserver(checkArrows);
                observer.observe(currentRef);

                const timeoutId = setTimeout(checkArrows, 50);

                return () => {
                    currentRef.removeEventListener('scroll', checkArrows);
                    observer.disconnect();
                    clearTimeout(timeoutId);
                };
            }
        }, [cards, checkArrows, isMobile]);
    
    return (
        <div className="player-hand-container">
            {/* Left Scroll Arrow (Visibility controlled by CSS via display: none/flex) */}
            {!isMobile && showLeftArrow && (
                <button className="scroll-arrow left-arrow" onClick={() => scrollHand('left')} disabled={!showLeftArrow}>
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
            )}

            {/* Scrollable Hand Cards Wrapper - This is the element that actually scrolls */}
            <div className="hand-cards-wrapper" ref={handCardsScrollRef}>
                <div className="hand-cards">
                    {cards.map((cardData, index) => {
                        const isCardSelected = selectedCards && selectedCards.some(
                            (selectedCardObject) => selectedCardObject.id === cardData.id,
                        );

                        return (
                            <div
                                key={cardData.id || `${cardData.rank}-${cardData.suit}-${index}`}
                                className={`card-wrapper ${isCardSelected ? 'selected' : ''}`}
                                onClick={() => onCardClick(cardData)}
                            >
                                <Card rank={cardData.rank} suit={cardData.suit} isFaceUp={true} isSelected={isCardSelected} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Scroll Arrow (Visibility controlled by CSS via display: none/flex) */}
            {!isMobile && showRightArrow && (
                <button className="scroll-arrow right-arrow" onClick={() => scrollHand('right')} disabled={!showRightArrow}>
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>
            )}
        </div>        
    );


};

export default Hand;