import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import api from '../api';

const GameContext = createContext(null);

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

    const getGameState = useCallback(async () => {
        if (!roomCode || !playerId) {
            console.warn("GameContext: Cannot fetch game state, roomCode or playerId missing.");
            return { success: false, message: "Missing roomCode or playerId." };
        }

        try {
            const response = await api.getGameState(roomCode, playerId);

            if (response.success) {
                setGameState(response);
                setError(null);
                return { success: true, ...response };
            } else {
                console.error("GameContext: Failed to fetch game state:", response.error);
                setError(response.error || "Failed to fetch game state.");
                if (response.error === "Game room not found." || response.error === "Player not found in this game or invalid game state.") {
                    console.log("GameContext: Room or player invalid, resetting game state.");
                    resetGameContextState();
                    navigate('/');
                }
                return { success: false, message: response.error || "Failed to fetch game state." };
            }
        } catch (err) {
            console.error("GameContext: API error fetching game state:", err);
            setError(`Network error: ${err.message}`);
            return { success: false, message: `Network error: ${err.message}` };
        }
    }, [roomCode, playerId, navigate]);

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
                setGameState(response.game_state);
                navigate(`/game/${gameType}/${response.room_code}`);
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
                setIsHost(false);
                setGameState(response.game_state);
                navigate(`/game/${response.game_type || 'asshole'}/${code}`);
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

    const getActiveRooms = useCallback(async (gameType) => {
        try {
            const result = await api.getActiveRooms(gameType);

            if (result.success) {
                console.log("Fetched lobbies successfully:", result.rooms);
                return { success: true, rooms: result.rooms };
            } else {
                console.error(`API Error for getActiveRooms:`, result.error || 'Unknown error');
                return { success: false, error: result.error || 'An unexpected error occurred.' };
            }
        } catch (unexpectedError) {
            console.error(`Unhandled Error in getActiveRooms callback:`, unexpectedError);
            return { success: false, error: 'An unexpected client-side error occurred.' };
        }
    });

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
        roomCode, setRoomCode,
        playerId, setPlayerId,
        isHost, setIsHost,
        gameState,
        isLoadingGame,
        error,
        setError,
        setGameState,
        createNewRoom,
        joinExistingRoom,
        getActiveRooms,
        leaveRoom,
        deleteRoom,
        startGame,
        playCards,
        passTurn,
        getGameState,
    }), [
        roomCode, playerId, isHost, gameState, isLoadingGame, error,
        createNewRoom, joinExistingRoom, leaveRoom, deleteRoom, getActiveRooms,
        startGame, playCards, passTurn, getGameState, setError, setGameState
    ]);

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};