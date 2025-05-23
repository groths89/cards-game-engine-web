import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';

// Import game components
import GameSelectionPage from './components/GameSelectionPage';
import GameLobbyPage from './components/GameLobbyPage';
import AssholeGamePage from './components/asshole/AssholeGamePage';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-Header">
          <h1>Card Game Engine</h1>
          <nav>
            <Link to="/">Home</Link>
          </nav>
        </header>

        <main>
          <Routes>
            {/* Route for the Home/Game Selection Page */}
            <Route path="/" element={<GameSelectionPage />} />
            {/* Route for the game lobby, with a gameType parameter */}
            <Route path="/lobby/:gameType" element={<GameLobbyPage />} />
            {/* Route for the goame board route, with gameType parameter and roomCode parameter */}
            <Route path="/game/:gameType/:roomCode" element={<AssholeGamePage />} />

            {/* TODO: Add more game routes as they are implemented */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
