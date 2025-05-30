import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import './GameLobbyPage.css';
import { useGame } from "../contexts/GameContext";

function GameLobbyPage() {
    const { createNewRoom, joinExistingRoom, isLoadingGame } = useGame();

    const navigate = useNavigate();
    const location = useLocation();

    const { gameType } = useParams();

    const [activeTab, setActiveTab] = useState('create'); // 'create' or 'join'
    const [createPlayerName, setCreatePlayerName] = useState('');
    const [joinRoomCode, setJoinRoomCode] = useState('');
    const [joinPlayerName, setJoinPlayerName] = useState('');
    const [error, setError] = useState('');
    const [lobbies, setLobbies] = useState([]);
    const [loadingLobbies, setLoadingLobbies] = useState(true);

    

    const fetchLobbies = useCallback(async () => {
        setLoadingLobbies(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/rooms');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setLobbies(data);
            setError('');
        } catch (apiError) {
            console.error('Error fetching lobbies:', apiError);
            setError('Failed to load active games. Please try again later.');
            setLobbies([]);        
        } finally {
            setLoadingLobbies(false)
        }
    }, []);

    useEffect(() => {
        fetchLobbies();

        const intervalId = setInterval(fetchLobbies, 5000);
        return () => clearInterval(intervalId);
    }, [fetchLobbies]);

    const handleCreateRoom = async (event) => {
        event.preventDefault();;
        setError('');

        if (!createPlayerName.trim()) {
            setError('Please enter your name.');
            return;
        }

        // Call the createNewRoom function from GameContext
        // It handles the API call, setting player/room in context, and navigation
        const playerIdReceived = await createNewRoom(gameType, createPlayerName);
        if (!playerIdReceived) {
            // If createNewRoom returns null (indicating failure), set a local error message.
            // The actual error message from API would be logged in GameContext.
            setError('Failed to create room. Please try again.');
        }
    }

    const handleJoinRoom = async (event) => {
        event.preventDefault();
    setError('');

        if (!joinRoomCode.trim() || joinRoomCode.trim().length !== 4) {
            setError('Room code must be 4 characters.');
            return;
        }
        if (!joinPlayerName.trim()) {
            setError('Please enter your name.');
            return;
        }

        await joinExistingRoom(joinRoomCode.toUpperCase(), joinPlayerName);
    }

    return (
        <div className="game-lobby-page-container">
            <h2>Join or Create Room for {gameType ? gameType.toUpperCase() : 'Game'}</h2>

            {error && <p className="error-message">{error}</p>}

            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                    disabled={isLoadingGame}
                >
                    Create Room
                </button>
                <button
                    className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
                    onClick={() => setActiveTab('join')}
                    disabled={isLoadingGame}
                >
                    Join Room
                </button>
            </div>

            <div className="tab-content">
                {isLoadingGame && <p>Loading...</p>}

                {activeTab === 'create' && (
                    <form onSubmit={handleCreateRoom} className="form-section">
                        <h2>Create New Game Room</h2>
                        <div className="form-group">
                            <label htmlFor="createPlayerName">Your Name:</label>
                            <input
                                type="text"
                                id="createPlayerName"
                                value={createPlayerName}
                                onChange={(e) => setCreatePlayerName(e.target.value)}
                                disabled={isLoadingGame}
                                required
                            />
                        </div>
                        <button type="submit" disabled={isLoadingGame}>
                            Create Room
                        </button>
                    </form>
                )}

                {activeTab === 'join' && (
                    <form onSubmit={handleJoinRoom} className="form-section">
                        <h2>Join Existing Game Room</h2>
                        <div className="form-group">
                            <label htmlFor="joinRoomCode">Room Code:</label>
                            <input
                                type="text"
                                id="joinRoomCode"
                                value={joinRoomCode}
                                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                                disabled={isLoadingGame}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="joinPlayerName">Your Name:</label>
                            <input
                                type="text"
                                id="joinPlayerName"
                                value={joinPlayerName}
                                onChange={(e) => setJoinPlayerName(e.target.value)}
                                disabled={isLoadingGame}
                                required
                            />
                        </div>
                        <button type="submit" disabled={isLoadingGame}>
                            Join Room
                        </button>
                    </form>
                )}
            </div>

            <hr className="divider" /> {/* Visual separator */}

            {/* Active Lobbies List (Read-only) */}
            <div className="active-lobbies-section form-section">
            <h3>Active Games List</h3>
            {loadingLobbies ? (
                <p>Loading active games...</p>
            ) : lobbies.length === 0 ? (
                <p>No active games available. Be the first to create one!</p>
            ) : (
                <div className="lobbies-grid">
                    {lobbies.map((lobby) => (
                        <div key={lobby.room_code} className="lobby-card small-card">
                            <h4>Room: {lobby.room_code}</h4>
                            <p>Game: {lobby.game_type ? lobby.game_type.toUpperCase() : 'N/A'}</p>
                            <p>Host: {lobby.host_name}</p>
                            <p>Players: {lobby.current_players} / {lobby.max_players}</p>
                            <p className={`lobby-status status-${lobby.status.toLowerCase().replace(' ', '-')}`}>
                                Status: {lobby.status.replace('_', ' ')}
                            </p>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}

export default GameLobbyPage;