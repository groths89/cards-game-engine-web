import React, { useState, useEffect } from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import './App.css';

// Import game components
import GameSelectionPage from './components/GameSelectionPage';
import GameLobbyPage from './components/GameLobbyPage';
import GamePage from './components/GamePage';
import AssholeGamePage from './components/games/asshole/AssholeGamePage';
import AppHeader from './components/layout/AppHeader';
import RulesPage from './pages/RulesPage';
import LeaderboardsPage from './pages/LeaderboardsPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import TournamentsPage from './pages/TournamentsPage';
import './pages/PageStyles.css';
import UserProfile from './components/user/UserProfile';

import { GameProvider } from './contexts/GameContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Define the media query
        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

        // Initial check
        setIsMobile(mediaQuery.matches);

        // Listener for changes
        const handleChange = (event) => {
            setIsMobile(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);

        // Cleanup
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [breakpoint]);

    return isMobile;
};

function App() {
    const isMobile = useIsMobile(768);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleMenuToggle = () => {
        setIsMenuOpen(prev => !prev);
    };

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        }
    }, [isMenuOpen]);

  return (
      <>
        {isMenuOpen && isMobile && <div className="menu-overlay" onClick={handleMenuToggle}></div>}
        
        <div className="app-container">

        <AppHeader isMobile={isMobile} isMenuOpen={isMenuOpen} onMenuToggle={handleMenuToggle} />

        <main className="app-main-content">
          <Routes>
            {/* Route for the Home/Game Selection Page */}
            <Route path="/" element={<GameSelectionPage />} />
            {/* Route for the game lobby, with a gameType parameter */}
            <Route path="/lobby/:gameType" element={<GameLobbyPage />} />
            {/* Route for the game board route, with gameType parameter and roomCode parameter */}
            <Route path="/game/:gameType/:roomCode" element={<GamePage isMobile={isMobile}><AssholeGamePage isMobile={isMobile}/></GamePage>} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/leaderboards" element={<LeaderboardsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/profile" element={<UserProfile />} />

            {/* TODO: Add more game routes as they are implemented */}
          </Routes>
        </main>

        </div>
      </>
  );
}

export default App;




