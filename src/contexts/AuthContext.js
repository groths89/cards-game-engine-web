import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signIn, signOut, signUp, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [idToken, setIdToken] = useState(null);

    const fetchUserProfile = useCallback(async (userId, token) => {
        if (!userId || !token) {
            setUserProfile(null);
            return { success: false, error: "Missing user ID or token." };
        }
        try {
            const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

            const response = await fetch(`${API_BASE_URL}/user_profile?player_id=${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.profile) {
                    setUserProfile(data.profile);
                    return { success: true, profile: data.profile };
                } else {
                    setUserProfile(null);
                    return { success: false, error: data.error || 'Backend profile fetch failed.' };
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                setUserProfile(null);
                return { success: false, error: errorData.error };
            }
        } catch (error) {
            setUserProfile(null);
            return { success: false, error: error.message };
        }
    }, []);

    const refreshUserAndToken = useCallback(async () => {
        try {
            setLoading(true);
            const cognitoUser = await getCurrentUser();
            const session = await fetchAuthSession();

            const extractedUser = {
                userId: cognitoUser.userId,
                username: cognitoUser.username,
                email: cognitoUser.signInDetails?.loginId || cognitoUser.attributes?.email,
            };
            setUser(extractedUser);
            setIdToken(session.tokens?.idToken?.toString());

            if (extractedUser.userId && session.tokens?.idToken?.toString()) {
                await fetchUserProfile(extractedUser.userId, session.tokens.idToken.toString());
            } else {
                setUserProfile(null);
            }

        } catch (error) {
            setUser(null);
            setIdToken(null);
            setUserProfile(null);
        } finally {
            setLoading(false);
        }
    }, [fetchUserProfile]);

    useEffect(() => {
        refreshUserAndToken();

        const listener = Hub.listen('auth', async ({ payload: { event } }) => {
            switch (event) {
                case 'signedIn':
                case 'signedUp':
                case 'autoSignIn':
                case 'tokenRefresh':
                case 'signInWithRedirect':
                case 'autoSignIn_failure':
                case 'tokenRefresh_failure':
                case 'signInWithRedirect_failure':
                    await refreshUserAndToken();
                    break;
                case 'signedOut':
                    setUser(null);
                    setIdToken(null);
                    setUserProfile(null);
                    break;
                default:
                    break;
            }
        });

        return () => Hub.remove(listener);
    }, [refreshUserAndToken]);

    const login = async (username, password) => {
        setLoading(true);
        try {
            const result = await signIn({ username, password });
            await refreshUserAndToken();
            return { success: true };
        } catch (error) {
            setLoading(false);
            return { success: false, error: error.message };
        }
    };

    const register = async (username, password, email) => {
        setLoading(true);
        try {
            const { user: cognitoUser } = await signUp({
                username,
                password,
                options: { userAttributes: { email } }
            });
            setLoading(false);
            return { success: true };
        } catch (error) {
            setLoading(false);
            return { success: false, error: error.message };
        }
    };

    const confirmSignUp = async (username, code) => {
        setLoading(true);
        try {
            await signUp({ username, code });
            await refreshUserAndToken();
            return { success: true };
        } catch (error) {
            setLoading(false);
            return { success: false, error: error.message };
        }
    };


    const logout = async () => {
        setLoading(true);
        try {
            await signOut();
            setUser(null);
            setIdToken(null);
            setUserProfile(null);
        } catch (error) {
            console.error('AuthContext: Error signing out:', error);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        idToken,
        login,
        register,
        confirmSignUp,
        logout,
        fetchUserProfile: useCallback((userId) => fetchUserProfile(userId, idToken), [fetchUserProfile, idToken])
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {/* Optionally, display a global loading indicator here if 'loading' is true */}
            {/* {loading && <div>Loading authentication...</div>} */}
        </AuthContext.Provider>
    );
};