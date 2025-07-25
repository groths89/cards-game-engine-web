import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/LocalAuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faGamepad, faPercentage, faCog, faUser } from '@fortawesome/free-solid-svg-icons'; // Added faUser
import './UserProfile.css';

// Import your logo image
import gregsGamesSocialLogoV2 from '../../assets/gregs-games-social-logo-v2.png'; // Adjust path as needed
// Or if you want the card/suits logo
import gregsGamesSocialLogoV3 from '../../assets/gregs-games-social-logo-v3.png'; // Adjust path as needed


const UserProfile = () => {
    const { user, userProfile, logout, fetchUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [preferences, setPreferences] = useState({
        theme: 'default', // Assuming you'll add theme selection later
        notifications: true,
        soundEnabled: true
    });

    useEffect(() => {
        // If userProfile exists and has preferences, use them. Otherwise, default to current state.
        if (userProfile?.userPreferences) {
            setPreferences(userProfile.userPreferences);
        } else {
            // If no preferences on userProfile, initialize with defaults
            setPreferences({
                theme: 'default',
                notifications: true,
                soundEnabled: true
            });
        }
    }, [userProfile]);

    const handleUpdatePreferences = async () => {
        setLoading(true);
        try {
            // Ensure you have an API endpoint for updating preferences
            const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8080';
            const response = await fetch(`${API_BASE_URL}/api/update_profile`, { // Assuming this endpoint exists
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: user.userId, // Use user.userId from context
                    preferences // Send the preferences state
                }),
                credentials: 'include' // Important for sessions
            });

            if (response.ok) {
                // Re-fetch profile to ensure UI updates with saved preferences
                await fetchUserProfile(user.userId);
                alert('Preferences updated!');
            } else {
                const errorData = await response.json();
                alert(`Failed to update preferences: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
            alert('An error occurred while updating preferences.');
        } finally {
            setLoading(false);
        }
    };

    // --- IMPORTANT: Handling the profile data and potential NaN ---
    // Make sure your backend (Option 1) is converting Decimal to actual numbers (int/float)
    // If not, you'd need to convert them here like:
    // const gamesPlayed = Number(userProfile.gamesPlayed || 0);
    // const gamesWon = Number(userProfile.gamesWon || 0);
    // const winRate = Number(userProfile.winRate || 0);
    // Assuming backend fix for now, directly use userProfile.gamesPlayed etc.

    // Fallback if profile data isn't loaded or is missing numeric fields
    const gamesPlayed = userProfile?.games_played != null ? userProfile.games_played : 0;
    const gamesWon = userProfile?.games_won != null ? userProfile.games_won : 0;
    const winRate = userProfile?.win_rate != null ? userProfile.win_rate : 0;

    const level = Math.floor(gamesPlayed / 5) + 1;
    const progressToNextLevel = (gamesPlayed % 5) * 20;


    if (!user || !userProfile) {
        return (
            <div className="user-profile-container"> {/* Re-using your container for consistency */}
                <div className="login-prompt">
                    <FontAwesomeIcon icon={faUser} size="3x" /> {/* Using faUser for generic login prompt */}
                    <h2>Please log in to view your profile</h2>
                    <p>Sign in to track your game statistics and customize your experience.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="user-profile"> {/* Changed to .user-profile */}
            <h2>User Profile</h2> {/* Added a main heading for the page */}

            <div className="profile-section"> {/* Changed to .profile-section */}
                <div className="profile-header">
                    {/* Using the Greg's Games Social Logo V2 as the avatar */}
                    <div className="profile-avatar">
                        <img src={gregsGamesSocialLogoV2} alt="User Avatar" className="avatar-image" />
                    </div>
                    <div className="profile-info">
                        <h1>{userProfile.username}</h1>
                        <p className="user-type">{userProfile.user_type || 'Player'} player</p> {/* Use user_type from backend */}
                        <div className="level-info">
                            <span>Level {level}</span>
                            <div className="level-progress-bar">
                                <div
                                    className="level-progress-fill"
                                    style={{ width: `${progressToNextLevel}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-section"> {/* Changed to .profile-section */}
                <h3>Statistics</h3> {/* Added heading for stats section */}
                <div className="profile-stats">
                    <div className="stat-card">
                        <FontAwesomeIcon icon={faGamepad} />
                        <div className="stat-info">
                            <h3>{gamesPlayed}</h3> {/* Using calculated gamesPlayed */}
                            <p>Games Played</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <FontAwesomeIcon icon={faTrophy} />
                        <div className="stat-info">
                            <h3>{gamesWon}</h3> {/* Using calculated gamesWon */}
                            <p>Games Won</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <FontAwesomeIcon icon={faPercentage} />
                        <div className="stat-info">
                            {/* Format winRate to a fixed number of decimals */}
                            <h3>{winRate.toFixed(1)}%</h3> {/* Using calculated winRate */}
                            <p>Win Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-section"> {/* Changed to .profile-section */}
                <h3><FontAwesomeIcon icon={faCog} /> Preferences</h3>
                <div className="preferences-form"> {/* Used your new class name */}
                    <label>
                        <input
                            type="checkbox"
                            checked={preferences.notifications}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                notifications: e.target.checked
                            })}
                        />
                        Enable Notifications
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={preferences.soundEnabled}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                soundEnabled: e.target.checked
                            })}
                        />
                        Enable Sound Effects
                    </label>
                    <button
                        onClick={handleUpdatePreferences}
                        disabled={loading}
                        className="btn-primary" // Used your new class name
                    >
                        {loading ? 'Updating...' : 'Save Preferences'}
                    </button>
                </div>
            </div>

            <div className="profile-actions">
                <button onClick={logout} className="btn-secondary"> {/* Used your new class name */}
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default UserProfile;
