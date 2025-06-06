import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GameContext = createContext(null);

const API_BASE_URL = 'http://127.0.0.1:5000'; // Your Flask backend URL

// Centralized API call helper within the context
const callApi = async (endpoint, method = 'GET', data = null) => {
    try {
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Only add body for methods that typically have one (POST, PUT, PATCH)
        if (method !== 'GET' && method !== 'HEAD' && data) {
            config.body = JSON.stringify(data);
        }

        // For GET requests with data, convert data to query parameters
        if (method === 'GET' && data) {
            const queryParams = new URLSearchParams(data).toString();
            endpoint = `${endpoint}?${queryParams}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const responseData = await response.json();

        // Backend's /game_state and /rooms endpoints return the data directly
        // without a 'success' key. For these, if response.ok, it's a success.
        // For other endpoints, they return { success: true/false, message, ... }
        if (response.ok) {
            // If the response itself contains a 'success' field, use it.
            // Otherwise, assume success if response.ok is true.
            return { success: responseData.success !== undefined ? responseData.success : true, ...responseData };
        } else {
            // If response.ok is false, it's an error.
            // Use the error message from the backend, or a generic one.
            const errorMessage = responseData.error || responseData.message || `HTTP error! status: ${response.status}`;
            console.error(`API Error for ${endpoint}:`, errorMessage);
            return { success: false, error: errorMessage };
        }
    } catch (networkError) {
        console.error(`Network Error for ${endpoint}:`, networkError);
        return { success: false, error: `Network error: ${networkError.message}` };
    }
};

// API functions defined using the internal callApi helper
const api = {
    createRoom: (gameType, playerName) => callApi('/create_room', 'POST', { game_type: gameType, player_name: playerName }),
    joinRoom: (roomCode, playerName) => callApi('/join_room', 'POST', { room_code: roomCode, player_name: playerName }),
    // Backend's /game_state is a GET request and takes room_code, player_id as query params
    getGameState: (roomCode, playerId) => callApi('/game_state', 'GET', { room_code: roomCode, player_id: playerId }),
    leaveRoom: (roomCode, playerId) => callApi('/leave_room', 'POST', { room_code: roomCode, player_id: playerId }),
    deleteRoom: (roomCode, playerId) => callApi('/delete_room', 'POST', { room_code: roomCode, player_id: playerId }),
    startGame: (roomCode, playerId) => callApi('/start_game_round', 'POST', { room_code: roomCode, player_id: playerId }),
    playCards: (roomCode, playerId, cards) => callApi('/play_cards', 'POST', { room_code: roomCode, player_id: playerId, cards: cards }),
    passTurn: (roomCode, playerId) => callApi('/pass_turn', 'POST', { room_code: roomCode, player_id: playerId }),
    // Backend's /rooms is a GET request and returns an array directly
    getActiveRooms: (gameType) => callApi(`/rooms${gameType ? `?game_type=${gameType}` : ''}`, 'GET'),
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
    const [isLoadingGame, setIsLoadingGame] = useState(false); // General loading for context actions
    const [error, setError] = useState(null); // General error for context actions

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

    // Function to fetch game state
    const getGameState = useCallback(async () => {
        // Only fetch if roomCode and playerId are available
        if (!roomCode || !playerId) {
            console.warn("GameContext: Cannot fetch game state, roomCode or playerId missing.");
            return { success: false, message: "Missing roomCode or playerId." };
        }

        try {
            // Backend's /game_state endpoint expects room_code and player_id as query parameters
            const response = await api.getGameState(roomCode, playerId);

            if (response.success) {
                // The backend's /game_state endpoint returns the game state directly
                // So, `response` here *is* the game state payload.
                setGameState(response); // Update the main game state
                setError(null); // Clear any previous errors
                return { success: true, ...response };
            } else {
                console.error("GameContext: Failed to fetch game state:", response.error);
                setError(response.error || "Failed to fetch game state.");
                // If room no longer exists or player kicked, reset state
                // Note: Backend's /game_state returns 404 for 'Game room not found' or 'Player not found'
                if (response.error === "Game room not found." || response.error === "Player not found in this game or invalid game state.") {
                    console.log("GameContext: Room or player invalid, resetting game state.");
                    resetGameContextState();
                    navigate('/'); // Redirect to home/lobby
                }
                return { success: false, message: response.error || "Failed to fetch game state." };
            }
        } catch (err) {
            console.error("GameContext: API error fetching game state:", err);
            setError(`Network error: ${err.message}`);
            return { success: false, message: `Network error: ${err.message}` };
        }
    }, [roomCode, playerId, navigate]); // Dependencies for useCallback

    const resetGameContextState = useCallback(() => {
        setRoomCode(null);
        setPlayerId(null);
        setIsHost(false);
        setGameState(null);
        setIsLoadingGame(false);
        setError(null);
        localStorage.removeItem('roomCode');
        localStorage.removeItem('playerId');
        localStorage.removeItem('isHost');
    }, []);

    // --- API Interaction Functions exposed by context ---

    const createNewRoom = useCallback(async (gameType, playerName) => {
        setIsLoadingGame(true);
        setError(null);
        try {
            const response = await api.createRoom(gameType, playerName);
            console.log("GameContext DEBUG: createRoom API response:", response);
            if (response.success) {
                setRoomCode(response.room_code);
                setPlayerId(response.player_id);
                setIsHost(true);
                setGameState(response.game_state); // Backend returns game_state directly in response
                navigate(`/game/${gameType}/${response.room_code}`); // Navigate after state is set
                return response.player_id;
            } else {
                setError(response.error || "Failed to create room.");
                return null;
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
            return null;
        } finally {
            setIsLoadingGame(false);
        }
    }, [navigate]);

    const joinExistingRoom = useCallback(async (code, playerName) => {
        setIsLoadingGame(true);
        setError(null);
        try {
            const response = await api.joinRoom(code, playerName);
            if (response.success) {
                setRoomCode(code);
                setPlayerId(response.player_id);
                setIsHost(false); // Joining player is never the host
                setGameState(response.game_state); // Backend returns game_state directly in response
                navigate(`/game/${response.game_type || 'asshole'}/${code}`); // Navigate after state is set
                return response.player_id;
            } else {
                setError(response.error || "Failed to join room.");
                return null;
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
            return null;
        } finally {
            setIsLoadingGame(false);
        }
    }, [navigate]);

    const leaveRoom = useCallback(async () => {
        setIsLoadingGame(true);
        setError(null);
        try {
            if (roomCode && playerId) {
                const response = await api.leaveRoom(roomCode, playerId);
                if (response.success) {
                    console.log("Left room successfully on backend.");
                } else {
                    setError(response.error || "Error leaving room on backend.");
                }
            } else {
                console.warn("Attempted to leave room without roomCode or playerId.");
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
        } finally {
            resetGameContextState(); // Always reset frontend state and navigate
            navigate('/');
            setIsLoadingGame(false);
        }
    }, [roomCode, playerId, navigate, resetGameContextState]);

    const deleteRoom = useCallback(async () => {
        setIsLoadingGame(true);
        setError(null);
        try {
            if (roomCode && playerId) {
                const response = await api.deleteRoom(roomCode, playerId);
                if (response.success) {
                    console.log("Room deleted successfully on backend.");
                } else {
                    setError(response.error || "Error deleting room on backend.");
                }
            } else {
                console.warn("Attempted to delete room without roomCode or playerId.");
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
        } finally {
            resetGameContextState();
            navigate('/');
            setIsLoadingGame(false);
        }
    }, [roomCode, playerId, navigate, resetGameContextState]);

    const startGame = useCallback(async () => {
        setIsLoadingGame(true);
        setError(null);
        try {
            if (!roomCode || !playerId) {
                setError("Cannot start game: roomCode or playerId missing.");
                return;
            }
            const response = await api.startGame(roomCode, playerId);
            if (response.success) {
                console.log("Game started successfully:", response.message);
                // Game state will be updated by the polling mechanism
            } else {
                setError(response.error || "Failed to start game.");
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
        } finally {
            setIsLoadingGame(false);
        }
    }, [roomCode, playerId]);

    const playCards = useCallback(async (cardsToPlay) => {
        setIsLoadingGame(true);
        setError(null);
        try {
            if (!roomCode || !playerId) {
                setError("Cannot play cards: roomCode or playerId missing.");
                return;
            }
            const response = await api.playCards(roomCode, playerId, cardsToPlay);
            if (response.success) {
                console.log("Cards played successfully:", response.message);
                // Game state will be updated by the polling mechanism
            } else {
                setError(response.error || "Failed to play cards.");
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
        } finally {
            setIsLoadingGame(false);
        }
    }, [roomCode, playerId]);

    const passTurn = useCallback(async () => {
        setIsLoadingGame(true);
        setError(null);
        try {
            if (!roomCode || !playerId) {
                setError("Cannot pass turn: roomCode or playerId missing.");
                return;
            }
            const response = await api.passTurn(roomCode, playerId);
            if (response.success) {
                console.log("Turn passed successfully:", response.message);
                // Game state will be updated by the polling mechanism
            } else {
                setError(response.error || "Failed to pass turn.");
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
        } finally {
            setIsLoadingGame(false);
        }
    }, [roomCode, playerId]);


    // --- Polling for Game State ---
    useEffect(() => {
        let intervalId;
        if (roomCode && playerId) {
            // Initial fetch on mount/roomCode/playerId change
            getGameState();

            // Set up polling
            intervalId = setInterval(() => {
                getGameState(); // Call the memoized getGameState
            }, 1000); // Poll every 1 second as per your original code
        }

        // Cleanup function for interval
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                console.log("Game state polling stopped.");
            }
        };
    }, [roomCode, playerId, getGameState]); // Dependencies for polling effect

    const value = useMemo(() => ({
        roomCode, setRoomCode, // setRoomCode is exposed for initial setting in LobbyPage
        playerId, setPlayerId, // setPlayerId is exposed for initial setting in LobbyPage
        isHost, setIsHost, // setIsHost is exposed for initial setting in LobbyPage
        gameState,
        isLoadingGame,
        error,
        setError, // Expose setError for components to set their own specific errors if needed
        setGameState, // Expose setGameState if direct updates are ever needed (rarely)
        // Exposed API interaction functions
        createNewRoom,
        joinExistingRoom,
        leaveRoom,
        deleteRoom,
        startGame,
        playCards,
        passTurn,
        // The getGameState function itself is part of the value for manual refresh if needed
        getGameState,
        // The api object is not exposed directly, components use the functions above
    }), [
        roomCode, playerId, isHost, gameState, isLoadingGame, error,
        createNewRoom, joinExistingRoom, leaveRoom, deleteRoom,
        startGame, playCards, passTurn, getGameState, setError, setGameState
    ]);

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};