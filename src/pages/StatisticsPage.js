import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faGamepad, faClock, faPercentage } from '@fortawesome/free-solid-svg-icons';

const StatisticsPage = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1><FontAwesomeIcon icon={faChartLine} /> Statistics</h1>
        <div className="placeholder-content">
          <p>Track your game performance and progress!</p>
          <div className="feature-list">
            <div className="feature-item">
              <FontAwesomeIcon icon={faGamepad} />
              <span>Games Played</span>
            </div>
            <div className="feature-item">
              <FontAwesomeIcon icon={faPercentage} />
              <span>Win Rate</span>
            </div>
            <div className="feature-item">
              <FontAwesomeIcon icon={faClock} />
              <span>Play Time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;