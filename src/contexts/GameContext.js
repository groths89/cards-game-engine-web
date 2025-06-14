import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from 'socket.io-client';

import api from '../api';

const BACKEND_URL = 'http://localhost:8080';
const socket = io(BACKEND_URL, {
    autoConnect: false,
    withCredentials: true
});

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
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || null);
    const [lobbyRooms, setLobbyRooms] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isHost, setIsHost] = useState(() => localStorage.getItem('isHost') === 'true' || false);
    const [gameState, setGameState] = useState(null);
    const [isLoadingGame, setIsLoadingGame] = useState(false);
    const [error, setError] = useState(null);

    const roomCodeRef = useRef(roomCode);
    const playerIdRef = useRef(playerId);
    const playerNameRef = useRef(playerName);
    const gameStateRef = useRef(gameState);

    useEffect(() => {
        roomCodeRef.current = roomCode;
        playerIdRef.current = playerId;
        playerNameRef.current = playerName;
        gameStateRef.current = gameState;
    }, [roomCode, playerId, playerName, gameState]);

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

    const resetGameContextState = useCallback(() => {
        setRoomCode(null);
        setPlayerId(null);
        setPlayerName(null);
        setIsHost(false);
        setGameState(null);
        setIsLoadingGame(false);
        setError(null);
        localStorage.removeItem('roomCode');
        localStorage.removeItem('playerId');
        localStorage.removeItem('playerName');
        localStorage.removeItem('isHost');
    }, []);

    const getGameState = useCallback(async () => {
        if (!roomCodeRef.current || !playerIdRef.current) {
            console.warn("GameContext: Cannot fetch game state, roomCode or playerId missing.");
            setGameState(null);
            setIsLoadingGame(false); 
            return { success: false, message: "Missing roomCode or playerId." };
        }

        setIsLoadingGame(true);
        setError(null);
        try {
            const response = await api.getGameState(roomCodeRef.current, playerIdRef.current);

            if (response.success) {
                setGameState(response);
                setIsHost(response.host_id === playerIdRef.current);
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
    }, [navigate, resetGameContextState]);

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        const onConnect = () => {
            setIsConnected(true);
            setError(null);
            console.log('Socket connected:', socket.id);
            if (playerIdRef.current && roomCodeRef.current) {
                console.log(`Attempting to re-join WebSocket room ${roomCodeRef.current} for player ${playerIdRef.current}`);
                socket.emit('join_game_room_socket', { room_code: roomCodeRef.current});
            }
        };

        const onDisconnect = () => {
            setIsConnected(false);
            console.log('Socket disconnected.');
        };

        const onStatus = (data) => {
            console.log('Server Status:', data.msg);
        };

        const onGameStateUpdate = (data) => {
            console.log('Received game_state_update:', data);
            if (data.room_code === roomCodeRef.current) {
                setGameState(data);
                setIsHost(data.host_id === playerIdRef.current);
            }
        };

        const onRoomUpdate = (data) => {
            console.log('Received room_update:', data);
            if (data.success && data.rooms) {
                setLobbyRooms(data.rooms);
            } else {
                console.warn("Received invalid room_update data:", data);
            }
        };

        const onReceiveChatMessage = (data) => {
            console.log('Received chat message:', data);
        };

        const onRoomDeleted = (data) => {
            console.log('Received room_deleted:', data);
            if (data.room_code === roomCodeRef.current) {
                alert(`Room ${data.room_code} has been deleted: ${data.message}`);
                resetGameContextState();
                navigate('/');
            }
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('status', onStatus);
        socket.on('game_state_update', onGameStateUpdate);
        socket.on('room_update', onRoomUpdate);
        socket.on('receive_chat_message', onReceiveChatMessage);
        socket.on('room_deleted', onRoomDeleted);

        return () => {
            socket.off('connect', onConnect);
            socket.off('status', onStatus);
            socket.off('game_state_update', onGameStateUpdate);
            socket.off('room_update', onRoomUpdate);
            socket.off('receive_chat_message', onReceiveChatMessage);
            socket.off('room_deleted', onRoomDeleted);
        };
    }, [navigate, resetGameContextState]);

    const createNewRoom = useCallback(async (gameType, playerName) => {
        setIsLoadingGame(true);
        setError(null);
        try {
            const response = await api.createRoom(gameType, playerName);
            if (response.success) {
                setRoomCode(response.room_code);
                setPlayerId(response.player_id);
                setPlayerName(response.player_name);
                setIsHost(true);
                setGameState(response.game_state);

                localStorage.setItem('playerID', response.player_id);
                localStorage.setItem('roomCode', response.room_code);
                localStorage.setItem('playerName', response.player_name);
                localStorage.setItem('isHost', 'true');

                socket.emit('join_game_room_socket', { room_code: response.room_code, player_id: response.player_id });
                console.log(`Emitted join_game_room_socket for room: ${response.room_code}`);

                navigate(`/game/${gameType}/${response.room_code}`);
                return response.player_id;
            } else {
                setError(response.error || "Failed to create room.");
                return { success: false, error: response.error };
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
            return { success: false, error: 'Network error or server unavailable.' };
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
                setPlayerName(response.player_name);
                setIsHost(false);
                setGameState(response.game_state);

                localStorage.setItem('playerID', response.player_id);
                localStorage.setItem('roomCode', code);
                localStorage.setItem('playerName', response.player_name);
                localStorage.setItem('isHost', (response.game_state.host_id === response.player_id).toString());

                socket.emit('join_game_room_socket', { room_code: code, player_id: response.player_id });
                console.log(`Emitted join_game_room_socket for room: ${code}`);

                navigate(`/game/${response.game_type || 'asshole'}/${code}`);
                return { success: true, room_code: code, player_id: response.player_id };
            } else {
                setError(response.error || "Failed to join room.");
                return { success: false, error: response.error };
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
            return { success: false, error: 'Network error or server unavailable.' };
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
        const currentRoomCode = roomCodeRef.current;
        const currentPlayerId = playerIdRef.current;

        setIsLoadingGame(true);
        setError(null);
        try {
            if (currentRoomCode && currentPlayerId) {
                const response = await api.leaveRoom(currentRoomCode, currentPlayerId);
                if (response.success) {
                    console.log("Left room successfully on backend.");
                    socket.emit('leave_game_room_socket', { room_code: currentRoomCode, player_id: currentPlayerId });
                    console.log(`Emitted leave_game_room_socket for room: ${currentRoomCode}`);
                } else {
                    setError(response.error || "Error leaving room on backend.");
                }
            } else {
                console.warn("Attempted to leave room without roomCode or playerId.");
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
        } finally {
            resetGameContextState();
            navigate('/');
            setIsLoadingGame(false);
        }
    }, [navigate, resetGameContextState]);

    const deleteRoom = useCallback(async () => {
        const currentRoomCode = roomCodeRef.current;
        const currentPlayerId = playerIdRef.current;

        setIsLoadingGame(true);
        setError(null);
        try {
            if (currentRoomCode && currentPlayerId) {
                const response = await api.deleteRoom(currentRoomCode, currentPlayerId);
                if (response.success) {
                    console.log("Room deleted successfully on backend.");
                    socket.emit('leave_game_room_socket', { room_code: currentRoomCode, player_id: currentPlayerId });
                    console.log(`Emitted leave_game_room_socket for room: ${currentRoomCode}`);
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
    }, [navigate, resetGameContextState]);

    const startGame = useCallback(async () => {
        setIsLoadingGame(true);
        setError(null);
        try {
        if (!roomCodeRef.current || !playerIdRef.current) {
            setError("Cannot start game: roomCode or playerId missing.");
            return { success: false, error: "Cannot start game: roomCode or playerId missing." };
        }
        const response = await api.startGame(roomCodeRef.current, playerIdRef.current);
        if (response.success) {
            console.log("Game started successfully:", response.message);
            return { success: true };
        } else {
            setError(response.error || "Failed to start game.");
            return { success: false, error: response.error };
        }
        } catch (err) {
        console.error('Error starting game:', err);
        setError('Network error or server unavailable.');
        return { success: false, error: 'Network error or server unavailable.' };
        } finally {
        setIsLoadingGame(false);
        }
    }, []);

    const playCards = useCallback(async (cardsToPlay) => {
        setIsLoadingGame(true);
        setError(null);
        try {
        if (!roomCodeRef.current || !playerIdRef.current || !gameStateRef.current) {
            setError('Not in a game or missing player/game info.');
            return { success: false, error: 'Not in a game or missing player/game info.' };
        }
        const response = await api.playCards(roomCodeRef.current, playerIdRef.current, cardsToPlay);
        if (response.success) {
            console.log("Cards played successfully:", response.message);
            return { success: true };
        } else {
            setError(response.error || "Failed to play cards.");
            return { success: false, error: response.error };
        }
        } catch (err) {
        console.error('Error playing cards:', err);
        setError('Network error or server unavailable.');
        return { success: false, error: 'Network error or server unavailable.' };
        } finally {
        setIsLoadingGame(false);
        }
    }, []);

    const passTurn = useCallback(async () => {
        setIsLoadingGame(true);
        setError(null);
        try {
        if (!roomCodeRef.current || !playerIdRef.current || !gameStateRef.current) {
            setError('Not in a game or missing player/game info.');
            return { success: false, error: 'Not in a game or missing player/game info.' };
        }
        const response = await api.passTurn(roomCodeRef.current, playerIdRef.current);
        if (response.success) {
            console.log("Turn passed successfully:", response.message);
            return { success: true };
        } else {
            setError(response.error || "Failed to pass turn.");
            return { success: false, error: response.error };
        }
        } catch (err) {
        console.error('Error passing turn:', err);
        setError('Network error or server unavailable.');
        return { success: false, error: 'Network error or server unavailable.' };
        } finally {
        setIsLoadingGame(false);
        }
    }, []);

    const value = useMemo(() => ({
        socket,
        roomCode, setRoomCode,
        playerId, setPlayerId,
        isHost, setIsHost,
        isConnected,
        gameState,
        isLoadingGame,
        error,
        getActiveRooms,
        setError,
        setGameState,
        createNewRoom,
        joinExistingRoom,
        lobbyRooms,
        leaveRoom,
        deleteRoom,
        startGame,
        playCards,
        passTurn,
        getGameState,
    }), [
        roomCode, playerId, isHost, isConnected, gameState, isLoadingGame, error, lobbyRooms,
        createNewRoom, joinExistingRoom, leaveRoom, deleteRoom, getActiveRooms,
        startGame, playCards, passTurn, getGameState, setError, setGameState
    ]);

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};