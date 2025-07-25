import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LocalAuthContext = createContext();

export const useAuth = () => {
    const context = useContext(LocalAuthContext);
    if (!context) {
        throw new Error('useAuth must be used within LocalAuthProvider');
    }
    return context;
};

export const LocalAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [authToken, setAuthToken] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    const fetchUserProfile = useCallback(async (userId) => {
        if (!userId) {
            console.warn("fetchUserProfile called without a userId. Cannot fetch profile.");
            setUserProfile(null);
            return;
        }
        setLoading(true); // Optional: add a specific loading state for profile fetch
        try {
            const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8080';
            const response = await fetch(`${API_BASE_URL}/user_profile?player_id=${userId}`, {
                method: 'GET',
                // Important for sessions:
                credentials: 'include' // Ensure cookies are sent and received
            });

            console.log('fetchUserProfile response status:', response.status);
            const data = await response.json();
            console.log('fetchUserProfile response data:', data);

            if (data.success && data.profile) {
                setUserProfile(data.profile);
                return { success: true, profile: data.profile };
            } else {
                console.error("Failed to fetch user profile:", data.error);
                setUserProfile(null);
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const signInUser = async (email, password) => {
        setLoading(true);
        try {
            const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8080';
            const response = await fetch(`${API_BASE_URL}/auth/mock_login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password })
            });
            
            console.log('Login response status:', response.status);
            console.log('Login response headers:', response.headers);
            
            const data = await response.json();
            
            if (data.success) {
                setUser({ userId: data.user_id, username: data.username });
                setAuthToken(data.access_token);
                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('username', data.username);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const signUpUser = async (email, password, username) => {
        setLoading(true);
        try {
            const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8080';
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email })
            });
            
            console.log('Register response status:', response.status);
            
            const data = await response.json();
            
            if (data.success) {
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const signOutUser = async () => {
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
    };

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const userId = localStorage.getItem('user_id');
        const username = localStorage.getItem('username');
        if (token && userId) {
            setUser({ userId, username });
            setAuthToken(token);
            fetchUserProfile(userId);
        }
    }, [fetchUserProfile]);

    const value = {
        user,
        userProfile,
        authToken,
        loading,
        signIn: signInUser,
        signUp: signUpUser,
        signOut: signOutUser,
        logout: signOutUser,
        fetchUserProfile
    };

    return (
        <LocalAuthContext.Provider value={value}>
            {children}
        </LocalAuthContext.Provider>
    );
};

