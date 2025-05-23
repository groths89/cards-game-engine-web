import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './GameLobbyPage.css';

function GameLobbyPage() {
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { gameType } = useParams();

    const generateRandomRoomCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const makeApiCall = async (actionType, generatedCode = null) => {
        setError('');

        // Basic client-side validation
        if (playerName.trim() === '') {
            setError('Please enter your name.');
        }        
        
        const codeToUse = actionType === 'create' ? generatedCode : roomCode;

        if (!codeToUse || codeToUse.length !== 4) {
            setError('Room code must be 4 characters');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/manage_game_room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room_code: codeToUse, 
                    player_name: playerName, 
                    game_type: gameType,
                    action: actionType
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Game joined/created successfully:', data);
                // Navigate to the specific game board using the roomCode
                const finalRoomCodeForNav = data.game_id; // Always rely on the backend's definitive room_code
                if (!finalRoomCodeForNav || finalRoomCodeForNav.length !== 4) {
                    setError("API response missing valid game_id. Cannot proceed.");
                    console.error("API response missing or invalid game_id:", data);
                    return;
                }

                const navigationPath = `/game/${gameType}/${finalRoomCodeForNav}`;
                console.log('Navigating to:', navigationPath, 'with player_id:', data.player_id);

                navigate(navigationPath, {
                    state: { playerId: data.player_id, playerName: playerName }
                });
            } else {
                setError(data.error || 'Failed to manage game room. Please try again.');
                console.error("API Error:", data);
            }
        } catch (apiError) {
            setError('Network error. Could not connect to the game server.');
            console.error('Network Error:', apiError);
        }
    };

    const handleCreateGame = (event) => {
        event.preventDefault();
        const newCode = generateRandomRoomCode();
        setRoomCode(newCode);
        makeApiCall('create', newCode);
    }

    const handleJoinGame = (event) => {
        event.preventDefault();
        makeApiCall('join');
    }

    return (
        <div className="game-lobby-page-container">
            <h2>Join or Create Room for {gameType ? gameType.toUpperCase(): 'Game'}</h2>
            <form onSubmit={(e) => e.preventDefault()} className="join-game-form">
                    {/* Hide roomCode input for 'create' action, maybe display it for user's info */}
                    <div className="form-group">
                        <label htmlFor="roomCode">Room Code:</label>
                        <input
                            type="text"
                            id="roomCode"
                            value={roomCode} // Bind to state
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())} // Convert to uppercase
                            placeholder="ABCD"
                            maxLength="4"
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                    <label htmlFor="playerName">NAME</label>
                    <input
                        type="text"
                        id="playerName"
                        placeholder="ENTER YOUR NAME"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="form-input"
                    />
                </div>

                {error && <p className="error-message">{error}</p>}

                <div className="button-group">
                    <button type="submit" onClick={handleCreateGame} className="play-button create-button">CREATE GAME</button>
                    <button type="submit" onClick={handleJoinGame} className="play-button join-button">JOIN GAME</button>
                </div>    
            </form>
        </div>
    );
}

export default GameLobbyPage;