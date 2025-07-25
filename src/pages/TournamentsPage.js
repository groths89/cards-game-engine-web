import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faTrophy, faCalendar, faUsers } from '@fortawesome/free-solid-svg-icons';

const TournamentsPage = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1><FontAwesomeIcon icon={faGlobe} /> Tournaments</h1>
        <div className="placeholder-content">
          <p>Compete in organized tournaments and climb the ranks!</p>
          <div className="feature-list">
            <div className="feature-item">
              <FontAwesomeIcon icon={faCalendar} />
              <span>Scheduled Events</span>
            </div>
            <div className="feature-item">
              <FontAwesomeIcon icon={faUsers} />
              <span>Team Tournaments</span>
            </div>
            <div className="feature-item">
              <FontAwesomeIcon icon={faTrophy} />
              <span>Prize Pools</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentsPage;