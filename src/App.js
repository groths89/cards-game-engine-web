import React, { useState } from 'react';
import { Route, Routes, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import logo from './assets/gregs-games-social-logo.png';

// Import game components
import GameSelectionPage from './components/GameSelectionPage';
import GameLobbyPage from './components/GameLobbyPage';
import AssholeGamePage from './components/asshole/AssholeGamePage';
import { useGame } from './contexts/GameContext';

const AppHeader = () => {
  const { roomCode: paramRoomCode, gameType: paramGameType } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { gameState, playerId, roomCode } = useGame(); // Bring these back to AppHeader

  const [error, setError] = useState(null);

  const isHost = gameState?.host_id === playerId;

  // Determine if we are on a game/lobby page for general header title
    const isLobbyPage = location.pathname.includes('/lobby/');

    // Determine if we are on an actual game page to show specific game info
    const isActualGamePage = location.pathname.includes('/game/');

    // Use roomCode from params or from gameState if available
    const displayRoomCode = paramRoomCode || (gameState ? gameState.room_code : null);
    const displayGameType = paramGameType || (gameState ? gameState.game_type : null); // Assuming game_type in gameState

    const currentPlayers = gameState?.num_active_players || 0;
    const minPlayers = gameState?.MIN_PLAYERS || 2; // Default 2 if not in state
    const maxPlayers = gameState?.MAX_PLAYERS || 6;  // Default 6 if not in state

    const handleLeaveRoom = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/leave_room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ room_code: roomCode, player_id: playerId }),
            });
            const data = await response.json();

            if (response.ok) {
                console.log('Left room successfully:', data.message);
                navigate('/lobby'); // Navigate back to the lobby after leaving
            } else {
                setError(data.error || 'Failed to leave room.');
                console.error('Leave Room API Error:', data);
            }            
        } catch (apiError) {
            setError('Network error. Could not leave room.');
            console.error('Network Error leaving room:', apiError);
        }
    }

    const handleDeleteRoom = async () => {
        if (!window.confirm("Are you sure you want to delete this room? This cannot be undone.")) {
            return; // User cancelled
        }
        try {
            const response = await fetch('http://127.0.0.1:5000/delete_room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ room_code: roomCode, player_id: playerId }),
            });
            const data = await response.json();

            if (response.ok) {
                console.log('Room deleted successfully:', data.message);
                navigate('/lobby'); // Navigate back to the lobby after deletion
            } else {
                setError(data.error || 'Failed to delete room.');
                console.error('Delete Room API Error:', data);
            }
        } catch (apiError) {
            setError('Network error. Could not delete room.');
            console.error('Network Error deleting room:', apiError);
        }
    };

  return (
    <header className="app-header">
      <img src={logo} alt="Greg's Games Social Logo" className="app-logo" />
      <nav>
        <Link to="/">Home</Link>
      </nav>
        {isActualGamePage && ( // Show game/lobby specific title
          <h2 className="game-board-title">
            {displayGameType ? displayGameType.charAt(0).toUpperCase() + displayGameType.slice(1).toLowerCase() + ' Game Board' : 'Game Board'}
          </h2>
        )}
        {isLobbyPage && ( // Show game/lobby specific title
          <h2 className="game-board-title">
            {displayGameType ? displayGameType.charAt(0).toUpperCase() + displayGameType.slice(1).toLowerCase() + ' Lobby' : 'Lobby'}
          </h2>
        )}
        {!isActualGamePage && !isLobbyPage && ( // Show generic app title
          <h2 className="app-title"></h2>
        )}

        {/* NEW CONTAINER FOR ROOM CODE & BUTTONS */}
            {(displayRoomCode || (isActualGamePage || location.pathname.includes('/lobby/'))) && ( // Only show this entire block if relevant
                <div className="header-right-info-column">
                    {/* Room Code Display */}
                    {displayRoomCode && (
                        <div className="room-code-display header-room-code-display">
                            <span className="room-code-label">ROOM CODE</span>
                            <span className="room-code-value">{displayRoomCode}</span>
                        </div>
                    )}

                    {/* Room Management Buttons - NOW LOCATED HERE IN HEADER */}
                    {displayRoomCode && ( // Only show buttons if there's a room code
                        <div className="room-management-actions header-room-management-actions">
                            <button className="button leave-room-button" onClick={handleLeaveRoom}>Leave Room</button>
                        </div>
                    )}
                </div> // END header-right-info-column
            )}

        {/* Lobby Status Display - show only if on a game/lobby page */}
        {(isActualGamePage || location.pathname.includes('/game/')) && (
            <div className="lobby-status-section">
                <h4>Lobby Status</h4>
                <div className="lobby-status-grid">
                    <div className="lobby-status-row">
                        <span className="lobby-label">Current:</span>
                        <div className="status-indicator-group">
                            <span className={`status-light ${currentPlayers >= minPlayers ? 'active' : 'inactive'}`}></span>
                            <span className="status-value">{currentPlayers}</span>
                        </div>
                    </div>
                    <div className="lobby-status-row">
                        <span className="lobby-label">Min Players:</span>
                        <span className="status-value">{minPlayers}</span>
                    </div>
                    <div className="lobby-status-row">
                        <span className="lobby-label">Max Players:</span>
                        <span className="status-value">{maxPlayers}</span>
                    </div>
                </div>
            </div>
        )}
    </header>
  );
};

function App() {
  return (
      <div className="app">
        <AppHeader />

        <main>
          <Routes>
            {/* Route for the Home/Game Selection Page */}
            <Route path="/" element={<GameSelectionPage />} />
            {/* Route for the game lobby, with a gameType parameter */}
            <Route path="/lobby/:gameType" element={<GameLobbyPage />} />
            {/* Route for the game board route, with gameType parameter and roomCode parameter */}
            <Route path="/game/:gameType/:roomCode" element={<AssholeGamePage />} />

            {/* TODO: Add more game routes as they are implemented */}
          </Routes>
        </main>
      </div>
  );
}

export default App;
