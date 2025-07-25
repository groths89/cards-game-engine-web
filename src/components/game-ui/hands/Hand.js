import React, { useEffect, useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Card from "../cards/Card";
import './Hand.css';

const Hand = ({cards, onCardClick, selectedCards, isMobile}) => {
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
    
    // Sort cards by rank (and optionally by suit within same rank)
    const sortedCards = [...cards].sort((a, b) => {
        // Convert ranks to numeric values for proper sorting
        const getRankValue = (rank) => {
            if (typeof rank === 'number') return rank;
            const rankStr = rank.toString();
            switch(rankStr) {
                case 'J': return 11;
                case 'Q': return 12;
                case 'K': return 13;
                case 'A': return 14;
                default: return parseInt(rankStr) || 0;
            }
        };
        
        const rankA = getRankValue(a.rank);
        const rankB = getRankValue(b.rank);
        
        if (rankA !== rankB) {
            return rankA - rankB;
        }
        
        // If same rank, sort by suit using the actual suit codes
        const suitOrder = { 'H': 0, 'D': 1, 'C': 2, 'S': 3 };
        return suitOrder[a.suit] - suitOrder[b.suit];
    });

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
                    {sortedCards.map((card, index) => {
                        const isSelected = selectedCards.some(selectedCard => 
                            selectedCard.suit === card.suit && selectedCard.rank === card.rank
                        );
                        
                        return (
                            <div
                                key={`${card.suit}-${card.rank}-${index}`}
                                className={`card-wrapper ${isSelected ? 'selected' : ''}`}
                                onClick={() => onCardClick(card)}
                            >
                                <Card 
                                    suit={card.suit} 
                                    rank={card.rank} 
                                    isFaceDown={false}
                                />
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
