import React from 'react';
import './RulesPage.css';

const RulesPage = () => {
  return (
    <div className="rules-page">
      <div className="rules-container">
        <h1>Game Rules</h1>
        
        <div className="game-rules-section">
          <h2>Asshole (Presidents)</h2>
          <div className="rules-content">
            <h3>Objective</h3>
            <p>Be the first player to get rid of all your cards to become the President!</p>
            
            <h3>Basic Rules</h3>
            <ul>
              <li>Players take turns playing cards of equal or higher rank</li>
              <li>You can play single cards or sets of the same rank</li>
              <li>If you can't or don't want to play, pass your turn</li>
              <li>Playing a 2 clears the pile and you start fresh</li>
              <li>First player out becomes President, last becomes Asshole</li>
            </ul>
            
            <h3>Card Rankings</h3>
            <p>4 (lowest) → 5 → 6 → 7 → 8 → 9 → 10 → J → Q → K → A (highest)</p>
            <p>2 clears the pile</p>
            <p>3 stalls the round of play, the second 3 clears the pile</p>
          </div>
        </div>
        
        <div className="coming-soon">
          <h2>More Games Coming Soon!</h2>
          <p>We're working on adding more card games. Stay tuned!</p>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;

