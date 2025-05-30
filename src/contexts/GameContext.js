import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GameContext = createContext(null);

const API_BASE_URL = 'http://127.0.0.1:5000';

const callApi = async (endpoint, method = 'GET', data = null) => {
    const url = new URL(endpoint, API_BASE_URL).toString();
    console.log("Attempting API Call to:", url, "with method:", method, "and data:", data);
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        console.log("-> Raw Fetch Response Status:", response.status, response.statusText);
        console.log("-> Raw Fetch Response Headers (Content-Type):", response.headers.get("content-type"));

        let jsonResponse = {};
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            try {
                jsonResponse = await response.json();
                console.log("-> Parsed JSON Response:", jsonResponse);
            } catch (jsonError) {
                console.warn(`-> WARN: JSON parsing failed for ${endpoint} (Status: ${response.status}). Error:`, jsonError);
                jsonResponse = { message: `Malformed JSON response from server or empty body: ${jsonError.message || 'No content'}` };
            }
        } else {
            // Handle non-JSON responses (like 405 HTML page, or 200 with no content)
            const textResponse = await response.text(); // Read as text
            console.warn(`-> WARN: Non-JSON content type received for ${endpoint} (Status: ${response.status}). Content-Type: ${contentType || 'None'}. Response Text:`, textResponse.substring(0, 100) + '...'); // Log a snippet
            jsonResponse = { message: response.statusText || `Request successful but no JSON content.` };
            // If it's a 405 or other error, Flask typically sends HTML, so we can't parse it as JSON
            // We should ensure the message reflects this or provide more details if needed
        }

        if (!response.ok) {
            const errorMessage = jsonResponse.message || `HTTP error! Status: ${response.status}. ${response.statusText}`;
            console.error(`-> API Call FAIL (HTTP Error): ${errorMessage}. Details:`, jsonResponse);
            return { success: false, status: response.status, message: errorMessage };
        }

        console.log(`-> API Call SUCCESS for ${endpoint}. Status: ${response.status}`);
        return { success: true, ...jsonResponse };
    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        return { success: false, message: `Network error or unhandled exception during fetch: ${error.message}` };
    }
};

const api = {
    createRoom: (gameType, playerName) => callApi('/create_room', 'POST', { game_type: gameType, player_name: playerName }),
    joinRoom: (roomCode, playerName) => callApi('/join_room', 'POST', { room_code: roomCode, player_name: playerName }),
    getGameState: (roomCode, playerId) => callApi('/game_state', 'GET', { room_code: roomCode, player_id: playerId }), // Assuming POST for get_game_state as per some Flask setups
    leaveRoom: (roomCode, playerId) => callApi('/leave_room', 'POST', { room_code: roomCode, player_id: playerId }),
    deleteRoom: (roomCode, playerId) => callApi('/delete_room', 'POST', { room_code: roomCode, player_id: playerId }),
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};



export const GameProvider = ({ children }) => {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState(() => localStorage.getItem('roomCode') || null);
    const [playerId, setPlayerId] = useState(() => localStorage.getItem('playerId') || null);
    const [isHost, setIsHost] = useState(() => localStorage.getItem('isHost') === 'true' || false);
    const [gameState, setGameState] = useState(null);
    const [isLoadingGame, setIsLoadingGame] = useState(false);
    const [error, setError] = useState(null);

    // Persist state to localStorage
    useEffect(() => {
        if (roomCode) {
            localStorage.setItem('roomCode', roomCode);
        } else {
            localStorage.removeItem('roomCode');
        }
    }, [roomCode]);

    useEffect(() => {
        if (playerId) {
            localStorage.setItem('playerId', playerId);
        } else {
            localStorage.removeItem('playerId');
        }
    }, [playerId]);

    useEffect(() => {
        localStorage.setItem('isHost', isHost.toString());
    }, [isHost]);

    const getGameState = useCallback(async (currentRoomCode, currentPlayerId, currentGameType) => {
        try {
            // Ensure callApi is robust as per previous steps
            const response = await api.getGameState(currentRoomCode, currentPlayerId, currentGameType);
            if (response.success) {
                // If the game state includes room_code, player_id, etc., you can update here
                // For polling, you might just update the gameState
                // setRoomCode(response.room_code); // Consider if you want to update these global states here
                // setPlayerId(response.player_id);
                setGameState(response); // Update the main game state
                setError(null); // Clear any previous errors
                return { success: true, ...response };
            } else {
                console.error("Failed to fetch game state:", response.message);
                setError(response.message || "Failed to fetch game state.");
                return { success: false, message: response.message || "Failed to fetch game state." };
            }
        } catch (err) {
            console.error("API error fetching game state:", err);
            setError(`Network error: ${err.message}`);
            return { success: false, message: `Network error: ${err.message}` };
        }
    }, []);

    const resetGameContextState = useCallback(() => {
        setRoomCode(null);
        setPlayerId(null);
        setIsHost(false);
        setGameState(null);
        setIsLoadingGame(false);
        localStorage.removeItem('roomCode');
        localStorage.removeItem('playerId');
        localStorage.removeItem('isHost');
    }, []);

    // --- API Interaction Functions ---

    const createNewRoom = useCallback(async (gameType, playerName) => {
        setIsLoadingGame(true);
        setError(null);
        try {
            const response = await api.createRoom(gameType, playerName);
            console.log("GameContext DEBUG: createRoom API response:", response);
            if (response.success) {
                setRoomCode(response.room_code);
                setPlayerId(response.player_id); // This will update state eventually
                setIsHost(true);
                setGameState(response.game_state);

                // Pass player_id and room_code directly in navigation state
                navigate(`/game/${gameType}/${response.room_code}`, {
                    state: {
                        roomCode: response.room_code,
                        playerId: response.player_id,
                        isHost: true // You might need this too
                    }
                });

                return response.player_id;
            } else {
                console.error("Error creating room:", response.message);
                return null;
            }
        } catch (error) {
            console.error("API error creating room:", error);
            return null;
        } finally {
            setIsLoadingGame(false);
        }
    }, [navigate]); // navigate is a dependency

    const joinExistingRoom = useCallback(async (code, playerName) => {
        setIsLoadingGame(true);
        try {
            const response = await api.joinRoom(code, playerName);
            if (response.success) {
                setRoomCode(code);
                setPlayerId(response.player_id);
                setIsHost(response.is_host || false); // Backend should indicate if host
                setGameState(response.current_game_state);
                navigate(`/game/${response.current_game_state.game_type || 'asshole'}/${code}`);
                return response.player_id;
            } else {
                console.error("Error joining room:", response.message);
                return null;
            }
        } catch (error) {
            console.error("API error joining room:", error);
            return null;
        } finally {
            setIsLoadingGame(false);
        }
    }, [navigate]); // navigate is a dependency


    const leaveRoom = useCallback(async () => {
        setIsLoadingGame(true);
        try {
            if (roomCode && playerId) { // Only attempt if we have room/player info
                const response = await api.leaveRoom(roomCode, playerId);
                if (response.success) {
                    console.log("Left room successfully on backend.");
                } else {
                    console.error("Error leaving room on backend:", response.message);
                }
            } else {
                console.warn("Attempted to leave room without roomCode or playerId.");
            }
        } catch (error) {
            console.error("API error leaving room:", error);
        } finally {
            // Always reset frontend state and navigate, regardless of backend success/failure
            resetGameContextState();
            navigate('/'); // Go back to home page
            setIsLoadingGame(false);
        }
    }, [roomCode, playerId, navigate, resetGameContextState]); // Dependencies for useCallback

    const deleteRoom = useCallback(async () => {
        setIsLoadingGame(true);
        try {
            if (roomCode && playerId) {
                const response = await api.deleteRoom(roomCode, playerId);
                if (response.success) {
                    console.log("Room deleted successfully on backend.");
                } else {
                    console.error("Error deleting room on backend:", response.message);
                }
            } else {
                console.warn("Attempted to delete room without roomCode or playerId.");
            }
        } catch (error) {
            console.error("API error deleting room:", error);
        } finally {
            resetGameContextState();
            navigate('/');
            setIsLoadingGame(false);
        }
    }, [roomCode, playerId, navigate, resetGameContextState]);

    // --- Polling for Game State (if not using WebSockets) ---
    useEffect(() => {
        let intervalId;
        if (roomCode && playerId) {
            intervalId = setInterval(async () => {
                try {
                    const response = await api.getGameState(roomCode, playerId);
                    if (response.success) {
                        setGameState(response.game_state);
                    } else {
                        console.error("Failed to fetch game state:", response.message);
                        // If room no longer exists or player kicked, reset state
                        if (response.message === "Room not found" || response.message === "Player not in room" || response.status === 404) {
                            console.log("Room or player invalid, resetting game state.");
                            resetGameContextState();
                            navigate('/');
                        }
                    }
                } catch (error) {
                    console.error("API error fetching game state:", error);
                    // Optionally reset state if fetching repeatedly fails due to network issues
                    // resetGameContextState();
                    // navigate('/');
                }
            }, 1000); // Poll every 1 second
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                console.log("Game state polling stopped.");
            }
        };
    }, [roomCode, playerId, navigate, resetGameContextState]);

    const value = useMemo(() => ({
        roomCode,
        playerId,
        isHost,
        gameState,
        isLoadingGame,
        error,
        setError,
        updateGameState: setGameState,
        createNewRoom,
        joinExistingRoom,
        leaveRoom,
        deleteRoom,
        getGameState,
    }), [
        roomCode, playerId, isHost, gameState, isLoadingGame, error,
        createNewRoom, joinExistingRoom, leaveRoom, deleteRoom, getGameState 
    ]);

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};