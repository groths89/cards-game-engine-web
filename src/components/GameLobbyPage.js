import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import './GameLobbyPage.css';
import { useGame } from "../contexts/GameContext";
import api from "../api";

function GameLobbyPage() {
    const {
        createNewRoom,
        joinExistingRoom,
        isLoadingGame,
        isLoadingRooms,
        lobbyRooms,
        error: contextError,
        getActiveRooms
    } = useGame();

    const navigate = useNavigate();
    const { gameType } = useParams();

    const [activeTab, setActiveTab] = useState('create');
    const [createPlayerName, setCreatePlayerName] = useState('');
    const [joinRoomCode, setJoinRoomCode] = useState('');
    const [joinPlayerName, setJoinPlayerName] = useState('');
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        setLocalError('');
    }, [activeTab]);

    useEffect(() => {
        console.log(`GameLobbyPage: Fetching active rooms for gameType: ${gameType}`);
        getActiveRooms(gameType);
    }, [getActiveRooms, gameType]);

    const handleCreateRoom = async (event) => {
        event.preventDefault();
        setLocalError(''); // Clear previous local errors

        if (!createPlayerName.trim()) {
            setLocalError('Please enter your name.');
            return;
        }

        // createNewRoom in GameContext handles API call, state updates, and navigation
        const result = await createNewRoom(gameType, createPlayerName.trim());
        if (!result.success) {
            setLocalError(result.error || 'Failed to create room. Please try again.');
        }
    };

    const handleJoinRoom = async (event) => {
        if (event) event.preventDefault(); // Event might be null if called from inline button
        setLocalError(''); // Clear previous local errors

        if (!joinRoomCode.trim() || joinRoomCode.trim().length !== 4) {
            setLocalError('Room code must be 4 characters.');
            return;
        }
        if (!joinPlayerName.trim()) {
            setLocalError('Please enter your name.');
            return;
        }

        const result = await joinExistingRoom(joinRoomCode.toUpperCase(), joinPlayerName.trim());
        if (!result.success) {
            setLocalError(result.error || 'Failed to join room. Please try again.');
        }
    };

    const displayGameType = gameType ? gameType.charAt(0).toUpperCase() + gameType.slice(1).toLowerCase() : 'Game';

    // Combine local error and context error
    const currentError = localError || contextError;

    return (
        <div className="game-lobby-page-container">
            <h2>Join or Create Room for {displayGameType}</h2>

            {currentError && <p className="error-message">{currentError}</p>}

            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                    disabled={isLoadingGame || isLoadingRooms}
                >
                    Create Room
                </button>
                <button
                    className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
                    onClick={() => setActiveTab('join')}
                    disabled={isLoadingGame || isLoadingRooms}
                >
                    Join Room
                </button>
            </div>

            <div className="tab-content">
                {isLoadingRooms && <p>Loading...</p>}

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
                                disabled={isLoadingGame || isLoadingRooms}
                                required
                            />
                        </div>
                        <button type="submit" disabled={isLoadingGame || isLoadingRooms || !createPlayerName.trim()}>
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
                                disabled={isLoadingGame || isLoadingRooms}
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
                                disabled={isLoadingGame || isLoadingRooms}
                                required
                            />
                        </div>
                        <button type="submit" disabled={isLoadingGame || isLoadingRooms || !joinRoomCode.trim() || !joinPlayerName.trim()}>
                            Join Room
                        </button>
                    </form>
                )}
            </div>

            <hr className="divider" /> {/* Visual separator */}

            {/* Active Lobbies List (Read-only) - Now uses lobbyRooms from context */}
            <div className="active-lobbies-section form-section">
                <h3>Active Games List</h3>
                {isLoadingRooms ? ( // Using isLoadingRooms from context for overall loading indicator
                    <p>Loading active games...</p>
                ) : lobbyRooms.length === 0 ? (
                    <p>No active games available. Be the first to create one!</p>
                ) : (
                    <div className="lobbies-grid">
                        {lobbyRooms
                            .filter(lobby => lobby.game_type === gameType.toLowerCase()) // Filter by gameType
                            .map((lobby) => (
                                <div key={lobby.room_code} className="lobby-card small-card">
                                    {/* Updated h4 tag to match requested structure */}
                                    <h4>{gameType ? gameType.charAt(0).toUpperCase() + gameType.slice(1).toLowerCase() : 'Game'}</h4>
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