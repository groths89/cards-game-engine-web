const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8080';

console.log('DEBUG (Frontend JS): API_BASE_URL (after process.env check):', API_BASE_URL);
console.log('DEBUG (Frontend JS): Raw process.env.REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);

const api = {
    /**
     * Generic helper for making API requests.
     * @param {string} endpoint The API endpoint (e.g., '/leave_room').
     * @param {object} [data] The data payload for POST requests.
     * @param {string} [method='POST'] The HTTP method.
     * @returns {Promise<object>} The JSON response from the API.
     */
    async makeRequest(endpoint, data = {}, method = 'POST') {
        try {
            const config = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (method !== 'GET' && method !== 'HEAD') {
                config.body = JSON.stringify(data);
            }

            const fullUrl = `${API_BASE_URL}${endpoint}`;
            console.log(`Making ${method} request to: ${fullUrl}`);
            
            const response = await fetch(fullUrl, config);
            
            console.log(`Response status: ${response.status}`);
            console.log(`Response headers:`, response.headers);

            // Check if response is actually JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();
                console.error(`Expected JSON but got: ${contentType}`);
                console.error(`Response body: ${textResponse.substring(0, 200)}...`);
                return { success: false, error: 'Server returned non-JSON response' };
            }

            const responseData = await response.json();

            if (!response.ok) {
                console.error(`API Error for ${endpoint}:`, responseData.error || 'Unknown error');
                return { success: false, error: responseData.error || 'An unexpected error occurred.' };
            }

            return { success: true, ...responseData };

        } catch (networkError) {
            console.error(`Network Error for ${endpoint}:`, networkError);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    /**
     * Creates a new game room.
     * @param {string} gameType The type of game (e.g., 'asshole').
     * @param {string} playerName The name of the host player.
     * @returns {Promise<object>} API response with room_code, player_id, etc.
     */
    createRoom: async (gameType, playerName) => {
        return api.makeRequest('/create_room', { game_type: gameType, player_name: playerName });
    },

    /**
     * Joins an existing game room.
     * @param {string} roomCode The code of the room to join.
     * @param {string} playerName The name of the joining player.
     * @returns {Promise<object>} API response with player_id, etc.
     */
    joinRoom: async (roomCode, playerName) => {
        return api.makeRequest('/join_room', { room_code: roomCode, player_name: playerName });
    },

    /**
     * Leaves a game room.
     * @param {string} roomCode The code of the room to leave.
     * @param {string} playerId The ID of the player leaving.
     * @returns {Promise<object>} API response.
     */
    leaveRoom: async (roomCode, playerId) => {
        return api.makeRequest('/leave_room', { room_code: roomCode, player_id: playerId });
    },

    /**
     * Deletes a game room (only for the host).
     * @param {string} roomCode The code of the room to delete.
     * @param {string} playerId The ID of the host player.
     * @returns {Promise<object>} API response.
     */
    deleteRoom: async (roomCode, playerId) => {
        return api.makeRequest('/delete_room', { room_code: roomCode, player_id: playerId });
    },

    /**
     * Fetches the current state of a game room.
     * @param {string} roomCode The code of the room.
     * @param {string} playerId The ID of the player requesting the state.
     * @returns {Promise<object>} API response with game_state.
     */
    getGameState: async (roomCode, playerId) => {
        // For GET requests, parameters are usually in the URL
        return api.makeRequest(`/game_state?room_code=${roomCode}&player_id=${playerId}`, {}, 'GET');
    },

    /**
     * Starts a game in a room.
     * @param {string} roomCode The code of the room.
     * @param {string} playerId The ID of the host player.
     * @returns {Promise<object>} API response.
     */
    startGame: async (roomCode, playerId) => {
        return api.makeRequest('/start_game_round', { room_code: roomCode, player_id: playerId });
    },

    /**
     * Plays cards in a game.
     * @param {string} roomCode The code of the room.
     * @param {string} playerId The ID of the player playing.
     * @param {Array<object>} cards The array of cards to play.
     * @returns {Promise<object>} API response.
     */
    playCards: async (roomCode, playerId, cards) => {
        return api.makeRequest('/play_cards', { room_code: roomCode, player_id: playerId, cards: cards });
    },

    /**
     * Passes a player's turn.
     * @param {string} roomCode The code of the room.
     * @param {string} playerId The ID of the player passing.
     * @returns {Promise<object>} API response.
     */
    passTurn: async (roomCode, playerId) => {
        return api.makeRequest('/pass_turn', { room_code: roomCode, player_id: playerId });
    },

    /**
     * Fetches a list of active rooms.
     * This now specifically targets the /rooms endpoint.
     * @param {string} [gameType] Optional: Filter by game type.
     * @returns {Promise<object>} API response with a list of active rooms.
     */
    getActiveRooms: async (gameType = '') => {
        // Assuming /rooms endpoint can take a game_type query parameter
        const query = gameType ? `?game_type=${gameType}` : '';
        return api.makeRequest(`/rooms${query}`, {}, 'GET'); // Changed endpoint to /rooms
    },

    /**
     * Submits a bid or passes during an active interrupt.
     * @param {string} roomCode The code of the room.
     * @param {string} playerId The ID of the player submitting the bid/pass.
     * @param {Array<object> | null} cards The array of cards to bid, or null if passing.
     * @returns {Promise<object>} API response.
     */
    submitInterruptBid: async (roomCode, playerId, cards, interruptType, interruptRank) => {
        return api.makeRequest('/submit_interrupt_bid', { room_code: roomCode, player_id: playerId, cards: cards, interrupt_type: interruptType, interrupt_rank: interruptRank });
    },
    // Add other game-specific API calls here as needed

    /**
     * Gets user profile and stats
     * @param {string} playerId The player ID (optional, uses session if not provided)
     * @returns {Promise<object>} API response with user profile
     */
    getUserProfile: async (playerId = '') => {
        const query = playerId ? `?player_id=${playerId}` : '';
        return api.makeRequest(`/user_profile${query}`, {}, 'GET');
    },

    /**
     * Gets user's game history
     * @param {string} playerId The player ID (optional, uses session if not provided)
     * @param {number} limit Number of recent games to fetch
     * @returns {Promise<object>} API response with game history
     */
    getUserGameHistory: async (playerId = '', limit = 10) => {
        const query = new URLSearchParams();
        if (playerId) query.append('player_id', playerId);
        query.append('limit', limit.toString());
        
        return api.makeRequest(`/user_game_history?${query}`, {}, 'GET');
    },
};

export default api;
