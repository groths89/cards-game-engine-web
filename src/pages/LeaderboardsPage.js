import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faAward } from '@fortawesome/free-solid-svg-icons';

const LeaderboardsPage = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1><FontAwesomeIcon icon={faTrophy} /> Leaderboards</h1>
        <div className="placeholder-content">
          <p>Global rankings and leaderboards coming soon!</p>
          <div className="feature-list">
            <div className="feature-item">
              <FontAwesomeIcon icon={faTrophy} />
              <span>Global Rankings</span>
            </div>
            <div className="feature-item">
              <FontAwesomeIcon icon={faMedal} />
              <span>Seasonal Competitions</span>
            </div>
            <div className="feature-item">
              <FontAwesomeIcon icon={faAward} />
              <span>Achievement Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardsPage;