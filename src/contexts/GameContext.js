import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from 'socket.io-client';

import api from '../api';

const getBackendUrl = ()  => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return 'http://localhost:8080'
    }

    return 'https://api.gregsgames.social'
}

const BACKEND_URL = getBackendUrl();
const socket = io(BACKEND_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling']
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
    const [playerInfo, setPlayerInfo] = useState({
        id: localStorage.getItem('player_id') || null,
        name: localStorage.getItem('player_name') || '',
        roomCode: localStorage.getItem('room_code') || null,
    });
    const { id: playerId, name: playerName, roomCode } = playerInfo;
    const [gameState, setGameState] = useState(null);

    const playerIdRef = useRef(playerId);
    const roomCodeRef = useRef(roomCode);
    const playerNameRef = useRef(playerName);
    const gameStateRef = useRef(null);

    useEffect(() => { playerIdRef.current = playerId; }, [playerId]);
    useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
    useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    const [lobbyRooms, setLobbyRooms] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isHost, setIsHost] = useState(() => localStorage.getItem('isHost') === 'true' || false);
    const [isFetchingGameState, setIsFetchingGameState] = useState(false);
    const [isFetchingRooms, setIsFetchingRooms] = useState(false);
    const [error, setError] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);

    const resetGameContextState = useCallback(() => {
        setIsHost(false);
        setGameState(null);
        setIsFetchingGameState(false);
        setIsFetchingRooms(false);
        setError(null);

        localStorage.removeItem('room_code');
        localStorage.removeItem('player_id');
        localStorage.removeItem('player_name');
        localStorage.removeItem('isHost');
    }, []);

    const updateGameState = useCallback((data) => {
        console.log('GameContext: Received game_state_update:', data);
        if (data.room_code === roomCodeRef.current) {
            setGameState(data);
            setIsHost(data.host_id === playerIdRef.current);
            // --- IMPORTANT LOGGING FOR DIAGNOSIS ---
            console.log(`Player ID in context (current user): ${playerIdRef.current}`);
            console.log(`Is this player the host? ${data.host_id === playerIdRef.current}`);
            console.log(`Total players in received payload: ${data.all_players_data ? data.all_players_data.length : 'N/A'}`);
            if (data.all_players_data) {
                console.log(`Player names in received payload: ${data.all_players_data.map(p => p.name).join(', ')}`);
            } else {
                console.warn("Payload missing 'all_players_data'.");
            }
            console.log(`Your hand size in received payload: ${data.your_hand ? data.your_hand.length : 'N/A'}`);
            // --- END IMPORTANT LOGGING ---
        } else {
            console.warn("GameContext: Received game_state_update for a different roomCode, ignoring.", data.room_code, roomCodeRef.current);
        }        
    }, []);

    const fetchGameState = useCallback(async () => {
        if (!roomCodeRef.current || !playerIdRef.current) {
            console.warn("GameContext: Cannot fetch game state, roomCode or playerId missing.");
            setGameState(null);
            setIsFetchingGameState(false); 
            return { success: false, message: "Missing roomCode or playerId." };
        }

        setIsFetchingGameState(true);
        setError(null);
        try {
            const response = await api.getGameState(roomCodeRef.current, playerIdRef.current);

            if (response.success) {
                updateGameState(response);
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
        } finally {
            setIsFetchingGameState(false);
        }
    }, [navigate, resetGameContextState, updateGameState]);

    const createNewRoom = useCallback(async (gameType, newPlayerName) => {
        setIsFetchingGameState(true);
        setError(null);
        try {
            const response = await api.createRoom(gameType, newPlayerName);
            if (response.success) {
                setPlayerInfo({
                    id: response.player_id,
                    name: response.player_name,
                    roomCode: response.room_code,
                });
                setIsHost(true);
                updateGameState(response.game_state);

                localStorage.setItem('player_id', response.player_id);
                localStorage.setItem('room_code', response.room_code);
                localStorage.setItem('player_name', response.player_name);
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
            setIsFetchingGameState(false);
        }
    }, [navigate, updateGameState]);

    const joinExistingRoom = useCallback(async (code, playerName) => {
        setIsFetchingGameState(true);
        setError(null);
        try {
            const response = await api.joinRoom(code, playerName);
            if (response.success) {
                setPlayerInfo({
                    id: response.player_id,
                    name: response.player_name,
                    roomCode: code,
                });
                setIsHost(false);
                updateGameState(response.game_state);

                localStorage.setItem('player_id', response.player_id);
                localStorage.setItem('room_code', code);
                localStorage.setItem('player_name', response.player_name);
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
            setIsFetchingGameState(false);
        }
    }, [navigate, updateGameState]);

    const getActiveRooms = useCallback(async (gameType) => {
        setIsFetchingRooms(true);
        try {
            const result = await api.getActiveRooms(gameType);

            if (result.success) {
                console.log("Fetched lobbies successfully:", result.rooms);
                setLobbyRooms(result.rooms)
                return { success: true, rooms: result.rooms };
            } else {
                console.error(`API Error for getActiveRooms:`, result.error || 'Unknown error');
                return { success: false, error: result.error || 'An unexpected error occurred.' };
            }
        } catch (unexpectedError) {
            console.error(`Unhandled Error in getActiveRooms callback:`, unexpectedError);
            return { success: false, error: 'An unexpected client-side error occurred.' };
        } finally {
            setIsFetchingRooms(false);
        }
    }, []);

    const leaveRoom = useCallback(async () => {
        const currentRoomCode = roomCodeRef.current;
        const currentPlayerId = playerIdRef.current;

        setIsFetchingGameState(true);
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
        }
    }, [navigate, resetGameContextState]);

    const deleteRoom = useCallback(async () => {
        const currentRoomCode = roomCodeRef.current;
        const currentPlayerId = playerIdRef.current;

        setIsFetchingGameState(true);
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
        }
    }, [navigate, resetGameContextState]);

    const startGame = useCallback(async () => {
        setIsFetchingGameState(true);
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
            setIsFetchingGameState(false);
        }
    }, []);

    const playCards = useCallback(async (cardsToPlay) => {
        setIsFetchingGameState(true);
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
            setIsFetchingGameState(false);
        }
    }, []);

    const passTurn = useCallback(async () => {
        setIsFetchingGameState(true);
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
            setIsFetchingGameState(false);
        }
    }, []);

    const submitInterruptBid = useCallback(async (cardsToBid) => {
        setIsFetchingGameState(true);
        setError(null);
        try {
            if (!roomCodeRef.current || !playerIdRef.current) {
                setError('Cannot submit bid: roomCode or playerId missing.');
                return { success: false, error: 'Cannot submit bid: roomCode or playerId missing.' };
            }

            const response = await api.submitInterruptBid(roomCodeRef.current, playerIdRef.current, cardsToBid);
            
            if (response.success) {
                console.log("Interrupt bid submitted successfully.");
                return { success: true };
            } else {
                setError(response.error || "Failed to submit interrupt bid.");
                return { success: false, error: response.error };
            }
        } catch (err) {
            console.error('Error submitting interrupt bid:', err);
            setError('Network error or server unavailable.');
            return { success: false, error: 'Network error or server unavailable.' };
        } finally {
            setIsFetchingGameState(false);
        }         
    }, []);

        useEffect(() => {
        if (!socket.connected) {
            console.log("Attempting to connect Socket.IO...");
            socket.connect();
        }

        const onConnect = () => {
            setIsConnected(true);
            setError(null);
            console.log('Socket connected:', socket.id);
            if (playerIdRef.current && roomCodeRef.current) {
                console.log(`Attempting to re-join WebSocket room ${roomCodeRef.current} for player ${playerIdRef.current}`);
                socket.emit('join_game_room_socket', { room_code: roomCodeRef.current});
            } else {
                getActiveRooms();
            }
        };

        const onDisconnect = () => {
            setIsConnected(false);
            console.log('Socket disconnected.');
        };

        const onStatus = (data) => {
            console.log('Server Status:', data.msg);
        };

        const handleGameStateUpdateEvent = (data) => {
            updateGameState(data);
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
            setChatHistory(prev => [...prev, { sender: data.sender, message: data.message }]);
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
        socket.on('game_state_update', handleGameStateUpdateEvent);
        socket.on('room_update', onRoomUpdate);
        socket.on('receive_chat_message', onReceiveChatMessage);
        socket.on('room_deleted', onRoomDeleted);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('status', onStatus);
            socket.off('game_state_update', handleGameStateUpdateEvent);
            socket.off('room_update', onRoomUpdate);
            socket.off('receive_chat_message', onReceiveChatMessage);
            socket.off('room_deleted', onRoomDeleted);
            if (socket.connected && roomCodeRef.current && playerIdRef.current) {
                socket.emit('leave_game_room_socket', { room_code: roomCodeRef.current, player_id: playerIdRef.current });
            }
        };
    }, [navigate, resetGameContextState, updateGameState, getActiveRooms, fetchGameState]);

    const isLoadingGame = useMemo(() => {
        return isFetchingGameState || (!!roomCode && !!playerId && !gameState);
    }, [isFetchingGameState, roomCode, playerId, gameState]);

    const value = useMemo(() => ({
        socket,
        roomCode,
        playerId,
        playerName,
        setPlayerInfo,
        isHost, setIsHost,
        isConnected,
        gameState,
        isLoadingGame,
        isLoadingRooms: isFetchingRooms,
        error,
        chatHistory,
        setChatHistory,
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
        fetchGameState,
        submitInterruptBid,
        lastPlayedCards: gameState?.last_played_cards || [],
        gameStatus: gameState?.game_status || "WAITING_FOR_PLAYERS",
        gameMessage: gameState?.game_message || "",
        currentPlayRank: gameState?.current_play_rank,
        currentPlayCount: gameState?.current_play_count,
        players: gameState?.all_players_data || [],
        yourHand: gameState?.your_hand || [],
        pile: gameState?.pile || [],
        currentTurnPlayerId: gameState?.current_turn_player_id,
        isMyTurn: gameState?.current_turn_player_id === playerId,
        isGameOver: gameState?.is_game_over || false,
        rankings: gameState?.rankings || {},
        gameStarted: gameState?.game_started || false,
        minPlayers: gameState?.MIN_PLAYERS || 2,
        maxPlayers: gameState?.MAX_PLAYERS || 10,
        interruptActive: gameState?.interrupt_active || false,
        interruptType: gameState?.interrupt_type || null,
        interruptInitiatorPlayerId: gameState?.interrupt_initiator_player_id || null,
        interruptRank: gameState?.interrupt_rank || null,
        interruptBids: gameState?.interrupt_bids || [],
    }), [
        roomCode, playerId, playerName, isHost, isConnected, gameState, error, lobbyRooms,
        createNewRoom, joinExistingRoom, leaveRoom, deleteRoom, getActiveRooms,
        startGame, playCards, passTurn, fetchGameState, setError, setGameState, submitInterruptBid, isLoadingGame, isFetchingRooms,
        setPlayerInfo, setChatHistory
    ]);

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};