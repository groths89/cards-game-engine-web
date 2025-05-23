import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './GameLobbyPage.css';

function GameLobbyPage() {
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { gameType } = useParams();

    const makeApiCall = async (actionType) => {
        setError('');

        // Basic client-side validation
        if (playerName.trim() === '') {
            setError('Please enter your name.');
        }        
        if (actionType === 'create' && roomCode.length !== 4) {
            setError('Create requires a 4-characters room code.');
        }
        if (actionType === 'join' && roomCode.length !== 4) {
            setError('Join requires a 4-characters room code.');
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/manage_game_room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room_code: roomCode, 
                    player_name: playerName, 
                    game_type: gameType,
                    action: actionType
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Game joined/created successfully:', data);
                // Navigate to the specific game board using the roomCode
                navigate(`/game/${gameType}/${data.game_id || roomCode}`, {
                    state: {playerId: data.player_id, playerName: playerName }
                });
            } else {
                setError(data.error || 'Failed to join game. Please try again.');
                console.error("API Error:", data);
            }
        } catch (apiError) {
            setError('Network error. Could not connect to the game server.');
            console.error('Network Error:', apiError);
        }
    };

    const handleCreateGame = (event) => {
        event.preventDefault();
        makeApiCall('create');
    }

    const handleJoinGame = (event) => {
        event.preventDefault();
        makeApiCall('join');
    }

    return (
        <div className="game-lobby-page-container">
            <h2>Join or Create Room for {gameType ? gameType.toUpperCase(): 'Game'}</h2>
            <form className="join-game-form">
                <div className="form-group">
                    <label htmlFor="roomCode">ROOM CODE</label>
                    <input
                        type="text"
                        id="roomCode"
                        placeholder="ENTER 4-LETTER CODE"
                        maxLength="4"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
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