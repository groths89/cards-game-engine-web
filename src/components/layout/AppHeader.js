import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Route, Routes, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
    faBars, 
    faTimes, 
    faSearch, 
    faBell, 
    faCaretDown, 
    faChevronUp, 
    faChevronDown, 
    faBolt, 
    faBoltLightning, 
    faHandPaper,
    faDiceD6,
    faShieldHalved,
    faUser,
    faTrophy,
    faCog,
    faEllipsisH,
    faQuestionCircle,
    faUsers,
    faShoppingCart,
    faTshirt,
    faGlobe,
    faCheck,
    faUserPlus,
    faGamepad,
    faStar,
    faKey,
    faBook,
    faChartLine,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import './AppHeader.css';
import logo from '../../assets/gregs-games-social-logo-v3.png';
import api from '../../api';
import { useGame } from '../../contexts/GameContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import LoginModal from '../auth/LoginModal';
import { useAuth } from '../../contexts/AuthContext';

const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
};

const AppHeader = ({isMobile, isMenuOpen, onMenuToggle}) => {
    const { playerId } = useGame(); // Get playerId directly from context
    const { 
        friends, 
        notifications, 
        friendRequests, 
        unreadCount,
        acceptFriendRequest,
        declineFriendRequest,
        markNotificationAsRead 
    } = useNotifications();
    
    const { roomCode: paramRoomCode, gameType: paramGameType } = useParams();
    const location = useLocation();
    const isActive = (path) => {
        if (path === '/lobby/asshole' && location.pathname.startsWith('/game/asshole/')) {
            return true;
        }
        return location.pathname === path;
    };

    const toggleGamesDropdown = () => {
        setIsGamesDropdownOpen(prev => !prev);
    };

    const toggleSingleplayerDropdown = () => {
        setIsSingleplayerDropdownOpen(prev => !prev);
    };

    const togglePartyDropdown = () => {
        setIsPartyDropdownOpen(prev => !prev);
    };

    const toggleMoreDropdown = () => {
        setIsMoreDropdownOpen(prev => !prev);
    };

    const toggleNotificationsPanel = () => {
        setIsNotificationsPanelOpen(prev => !prev);
    };

    const [userProfile, setUserProfile] = useState(null);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isGamesDropdownOpen, setIsGamesDropdownOpen] = useState(false);
    const [isSingleplayerDropdownOpen, setIsSingleplayerDropdownOpen] = useState(false);
    const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
    const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
    const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
    const [activeNotificationTab, setActiveNotificationTab] = useState('friends');
    const gamesDropdownRef = useRef(null);
    const profileDropdownRef = useRef(null);
    const singleplayerDropdownRef = useRef(null);
    const partyDropdownRef = useRef(null);
    const moreDropdownRef = useRef(null);
    const notificationsPanelRef = useRef(null);

    // Add these state variables
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const { user, logout } = useAuth();

    // Add login/logout handlers
    const handleLoginSuccess = () => {
        setIsLoginModalOpen(false);
        // The useEffect hook will automatically fetch the user profile
        // when the `user` object from useAuth() is updated.
    };

    const handleLogout = async () => {
        await logout();
        setUserProfile(null);
        setIsProfileDropdownOpen(false);
    };

    // Load user profile when player ID is available OR when user is logged in
    useEffect(() => {
        const loadUserProfile = async () => {
            // Try to get profile from logged-in user first
            if (user && user.userId) {
                try {
                    let response = await api.getUserProfile(user.userId);
                    console.log('Profile API response for logged-in user:', response);

                    if (!response.success && response.error === 'User not found') {
                        console.log('User profile not found, attempting to create one...');
                        const createResponse = await api.createUserProfile(user.userId, user.username);
                        if (createResponse.success && createResponse.profile) {
                            console.log('User profile created successfully.', createResponse.profile);
                            setUserProfile(createResponse.profile);
                        } else {
                            console.error('Failed to create user profile:', createResponse.error);
                        }
                        return;
                    }

                    if (response.success && response.profile) {
                        setUserProfile(response.profile);
                        return;
                    }
                } catch (error) {
                    console.log('Profile API error for logged-in user:', error);
                }
            }
            
            // Fallback to playerId if available
            if (playerId) {
                try {
                    const response = await api.getUserProfile(playerId);
                    console.log('Profile API response:', response);
                    if (response.success && response.profile) {
                        setUserProfile(response.profile);
                    }
                } catch (error) {
                    console.log('Profile API error:', error);
                }
            }
        };
        
        loadUserProfile();
    }, [playerId, user]);

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(prev => !prev);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Add chat button exclusion
            if (event.target.closest('.chat-toggle-button')) {
                return; // Don't close notifications if clicking chat button
            }
            
            if (gamesDropdownRef.current && !gamesDropdownRef.current.contains(event.target)) {
                setIsGamesDropdownOpen(false);
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
            if (singleplayerDropdownRef.current && !singleplayerDropdownRef.current.contains(event.target)) {
                setIsSingleplayerDropdownOpen(false);
            }
            if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target)) {
                setIsPartyDropdownOpen(false);
            }
            if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target)) {
                setIsMoreDropdownOpen(false);
            }
            if (notificationsPanelRef.current && !notificationsPanelRef.current.contains(event.target)) {
                setIsNotificationsPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!isMenuOpen) {
            setIsGamesDropdownOpen(false);
            setIsSingleplayerDropdownOpen(false);
            setIsPartyDropdownOpen(false);
            setIsMoreDropdownOpen(false);
            setIsNotificationsPanelOpen(false);
        }
    }, [isMenuOpen]);

    const toggleMobileMenu = () => {
        onMenuToggle();
    };

    const renderMobileNavigation = () => (
        <div className={`mobile-nav-overlay ${isMenuOpen ? 'open' : ''}`}>
            <div className="mobile-nav-content">
                {/* User Profile Section */}
                <div className="mobile-user-profile">
                    <div className="mobile-user-avatar">
                        <FontAwesomeIcon icon={faUser} />
                    </div>
                    <div className="mobile-user-info">
                        <h3>Player {playerId}</h3>
                        <div className="mobile-user-stats">
                            <span><FontAwesomeIcon icon={faTrophy} /> Level 5</span>
                            <span><FontAwesomeIcon icon={faStar} /> 1,250 XP</span>
                        </div>
                    </div>
                </div>

                {/* Games Section */}
                <div className="mobile-nav-section">
                    <div className="mobile-nav-title">Games</div>
                    <Link to="/lobby/asshole" className={`mobile-nav-item ${isActive('/lobby/asshole') ? 'active' : ''}`} onClick={toggleMobileMenu}>
                        <div className="mobile-nav-icon">
                            <FontAwesomeIcon icon={faHandPaper} />
                        </div>
                        <div>
                            <div>Asshole</div>
                            <div style={{fontSize: '0.8em', color: 'var(--text-secondary)'}}>Card shedding game</div>
                        </div>
                    </Link>
                </div>

                {/* Party Section */}
                <div className="mobile-nav-section">
                    <div className="mobile-nav-title">Party</div>
                    <div className="mobile-nav-item">
                        <div className="mobile-nav-icon">
                            <FontAwesomeIcon icon={faUsers} />
                        </div>
                        <div>
                            <div>Create Party</div>
                            <div style={{fontSize: '0.8em', color: 'var(--text-secondary)'}}>Play with friends</div>
                        </div>
                    </div>
                    <div className="mobile-nav-item">
                        <div className="mobile-nav-icon">
                            <FontAwesomeIcon icon={faKey} />
                        </div>
                        <div>
                            <div>Join with Code</div>
                            <div style={{fontSize: '0.8em', color: 'var(--text-secondary)'}}>Enter room code</div>
                        </div>
                    </div>
                </div>

                {/* More Section */}
                <div className="mobile-nav-section">
                    <div className="mobile-nav-title">More</div>
                    <div className="mobile-nav-item disabled">
                        <div className="mobile-nav-icon">
                            <FontAwesomeIcon icon={faTrophy} />
                        </div>
                        <div>Leaderboards</div>
                        <span className="coming-soon-badge">Soon</span>
                    </div>
                    <Link to="/rules" className="mobile-nav-item" onClick={toggleMobileMenu}>
                        <div className="mobile-nav-icon">
                            <FontAwesomeIcon icon={faBook} />
                        </div>
                        <div>Rules</div>
                    </Link>
                    <div className="mobile-nav-item disabled">
                        <div className="mobile-nav-icon">
                            <FontAwesomeIcon icon={faChartLine} />
                        </div>
                        <div>Statistics</div>
                        <span className="coming-soon-badge">Soon</span>
                    </div>
                    <Link to="/settings" className="mobile-nav-item" onClick={toggleMobileMenu}>
                        <div className="mobile-nav-icon">
                            <FontAwesomeIcon icon={faCog} />
                        </div>
                        <div>Settings</div>
                    </Link>
                    <div className="mobile-nav-item disabled">
                        <div className="mobile-nav-icon">
                            <FontAwesomeIcon icon={faQuestionCircle} />
                        </div>
                        <div>Help & Support</div>
                        <span className="coming-soon-badge">Soon</span>
                    </div>
                </div>
            </div>
        </div>
    );

  return (
    <header className="app-header">
        <div className="header-left">
            <Link to="/" className="app-logo-link">
                <img src={logo} alt="Greg's Games Social" className="app-logo" />
            </Link>
            
            {isMobile && (
                <button className="mobile-menu-button" onClick={toggleMobileMenu}>
                    <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
                </button>
            )}
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
            <nav className="header-center">
                <ul>
                    <li className="nav-dropdown" ref={gamesDropdownRef}>
                        <button 
                            className={`nav-dropdown-button ${isActive('/lobby/asshole') ? 'active' : ''}`}
                            onClick={toggleGamesDropdown}
                        >
                            Multiplayer
                            <FontAwesomeIcon icon={faChevronDown} className="nav-dropdown-icon" />
                        </button>
                        
                        <div className={`nav-dropdown-menu ${isGamesDropdownOpen ? 'open' : ''}`}>
                            <div className="dropdown-category">
                                <span className="category-label">COMPETITIVE</span>
                                
                                <Link to="/lobby/asshole" className="game-mode-item" onClick={() => setIsGamesDropdownOpen(false)}>
                                    <div className="game-mode-icon">
                                        <FontAwesomeIcon icon={faHandPaper} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">ASSHOLE</span>
                                        <span className="game-mode-description">Classic card shedding game with ranking system!</span>
                                    </div>
                                </Link>
                                
                                <div className="game-mode-item disabled">
                                    <div className="game-mode-icon">
                                        <FontAwesomeIcon icon={faDiceD6} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">POKER</span>
                                        <span className="game-mode-description">Texas Hold'em tournaments and cash games!</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </div>
                            </div>
                            
                            <div className="dropdown-category">
                                <span className="category-label">JUST FOR FUN</span>
                                
                                <div className="game-mode-item disabled">
                                    <div className="game-mode-icon">
                                        <FontAwesomeIcon icon={faShieldHalved} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">PARTY GAMES</span>
                                        <span className="game-mode-description">Quick party games for groups of friends!</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </div>
                                
                                <div className="game-mode-item disabled">
                                    <div className="game-mode-icon">
                                        <FontAwesomeIcon icon={faBoltLightning} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">SPEED ROUNDS</span>
                                        <span className="game-mode-description">Fast-paced games with quick matchmaking!</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li className="nav-dropdown" ref={singleplayerDropdownRef}>
                        <button 
                            className={`nav-dropdown-button ${isActive('/singleplayer') ? 'active' : ''}`}
                            onClick={toggleSingleplayerDropdown}
                        >
                            Singleplayer
                            <FontAwesomeIcon icon={faChevronDown} className="nav-dropdown-icon" />
                        </button>
                        
                        <div className={`nav-dropdown-menu ${isSingleplayerDropdownOpen ? 'open' : ''}`}>
                            <div className="dropdown-category">
                                <Link to="/singleplayer/practice" className="game-mode-item disabled" onClick={() => setIsSingleplayerDropdownOpen(false)}>
                                    <div className="game-mode-icon practice">
                                        <FontAwesomeIcon icon={faHandPaper} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">PRACTICE MODE</span>
                                        <span className="game-mode-description">Practice Asshole against AI opponents to improve your skills!</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </Link>
                                
                                <Link to="/singleplayer/challenges" className="game-mode-item disabled" onClick={() => setIsSingleplayerDropdownOpen(false)}>
                                    <div className="game-mode-icon challenges">
                                        <FontAwesomeIcon icon={faTrophy} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">DAILY CHALLENGES</span>
                                        <span className="game-mode-description">Complete daily card challenges and earn rewards!</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </Link>
                            </div>
                        </div>
                    </li>
                    <li className="nav-dropdown" ref={partyDropdownRef}>
                        <button 
                            className={`nav-dropdown-button ${isActive('/party') ? 'active' : ''}`}
                            onClick={togglePartyDropdown}
                        >
                            Party
                            <FontAwesomeIcon icon={faChevronDown} className="nav-dropdown-icon" />
                        </button>
                        
                        <div className={`nav-dropdown-menu ${isPartyDropdownOpen ? 'open' : ''}`}>
                            <div className="dropdown-category">
                                <Link to="/party/create" className="game-mode-item disabled" onClick={() => setIsPartyDropdownOpen(false)}>
                                    <div className="game-mode-icon party">
                                        <FontAwesomeIcon icon={faUsers} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">CREATE PARTY</span>
                                        <span className="game-mode-description">Start a private game with friends.</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </Link>
                                
                                <Link to="/party/join" className="game-mode-item disabled" onClick={() => setIsPartyDropdownOpen(false)}>
                                    <div className="game-mode-icon join-code">
                                        <FontAwesomeIcon icon={faKey} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">JOIN WITH CODE</span>
                                        <span className="game-mode-description">Have a code? Enter it here.</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </Link>
                            </div>
                        </div>
                    </li>
                    <li className="nav-dropdown" ref={moreDropdownRef}>
                        <button 
                            className="nav-more-button"
                            onClick={toggleMoreDropdown}
                        >
                            <FontAwesomeIcon icon={faEllipsisH} />
                        </button>
                        
                        <div className={`nav-dropdown-menu more-menu ${isMoreDropdownOpen ? 'open' : ''}`}>
                            <div className="dropdown-category">
                                <Link to="/leaderboards" className="game-mode-item disabled" onClick={() => setIsMoreDropdownOpen(false)}>
                                    <div className="game-mode-icon">
                                        <FontAwesomeIcon icon={faTrophy} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">LEADERBOARDS</span>
                                        <span className="game-mode-description">Global rankings and competitions</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </Link>
                                
                                <Link to="/rules" className="game-mode-item" onClick={() => setIsMoreDropdownOpen(false)}>
                                    <div className="game-mode-icon">
                                        <FontAwesomeIcon icon={faBook} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">RULES</span>
                                        <span className="game-mode-description">Learn how to play</span>
                                    </div>
                                </Link>
                                
                                <Link to="/statistics" className="game-mode-item disabled" onClick={() => setIsMoreDropdownOpen(false)}>
                                    <div className="game-mode-icon">
                                        <FontAwesomeIcon icon={faChartLine} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">STATISTICS</span>
                                        <span className="game-mode-description">View your game stats</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </Link>
                                
                                <Link to="/settings" className="game-mode-item" onClick={() => setIsMoreDropdownOpen(false)}>
                                    <div className="game-mode-icon">
                                        <FontAwesomeIcon icon={faCog} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">SETTINGS</span>
                                        <span className="game-mode-description">Game preferences</span>
                                    </div>
                                </Link>
                                
                                <Link to="/help" className="game-mode-item disabled" onClick={() => setIsMoreDropdownOpen(false)}>
                                    <div className="game-mode-icon">
                                        <FontAwesomeIcon icon={faQuestionCircle} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">HELP & SUPPORT</span>
                                        <span className="game-mode-description">Get help and support</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </Link>
                                
                                <Link to="/tournaments" className="game-mode-item tournament-item disabled" onClick={() => setIsMoreDropdownOpen(false)}>
                                    <div className="game-mode-icon">
                                        <FontAwesomeIcon icon={faGlobe} />
                                    </div>
                                    <div className="game-mode-info">
                                        <span className="game-mode-title">TOURNAMENTS</span>
                                        <span className="game-mode-description">Compete in tournaments</span>
                                    </div>
                                    <span className="coming-soon-badge">Soon</span>
                                </Link>
                            </div>
                        </div>
                    </li>
                </ul>
            </nav>
        )}

        <div className="header-right">
            <button className="header-search-button">
                <FontAwesomeIcon icon={faSearch} />
            </button>
            
            {!user && (
                <button 
                    className="header-login-button"
                    onClick={() => setIsLoginModalOpen(true)}
                >
                    Sign In
                </button>
            )}
            
            {!isMobile && userProfile && (
                <div className="user-profile-compact" ref={profileDropdownRef}>
                    <button 
                        className="user-profile-button-compact"
                        onClick={toggleProfileDropdown}
                    >
                        <div className="user-avatar-compact">
                            <FontAwesomeIcon icon={faUser} />
                        </div>
                        <div className="user-info-compact">
                            <span className="user-name-compact">{userProfile.username}</span>
                            <div className="user-level-bar">
                                <span className="level-text">LVL {Math.floor((userProfile.games_played || 0) / 5) + 1}</span>
                                <div className="level-progress">
                                    <div className="level-progress-fill" style={{width: `${((userProfile.games_played || 0) % 5) * 20}%`}}></div>
                                </div>
                            </div>
                            <div className="user-stats-compact">
                                <FontAwesomeIcon icon={faTrophy} />
                                <span>{userProfile.games_won || 0}</span>
                            </div>
                        </div>
                        <FontAwesomeIcon icon={faChevronDown} className="profile-dropdown-arrow" />
                    </button>
                    
                    {isProfileDropdownOpen && (
                        <div className="profile-dropdown-menu">
                            <Link to="/profile" className="profile-dropdown-item" onClick={() => setIsProfileDropdownOpen(false)}>
                                <FontAwesomeIcon icon={faUser} />
                                <span>View Profile</span>
                            </Link>
                            <Link to="/settings" className="profile-dropdown-item" onClick={() => setIsProfileDropdownOpen(false)}>
                                <FontAwesomeIcon icon={faCog} />
                                <span>Settings</span>
                            </Link>
                            <div className="profile-dropdown-divider"></div>
                            <button className="profile-dropdown-item logout" onClick={handleLogout}>
                                <FontAwesomeIcon icon={faSignOutAlt} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            <button className="header-notifications-button" onClick={toggleNotificationsPanel}>
                <FontAwesomeIcon icon={faBell} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>
        </div>

        {/* Mobile Navigation */}
        {isMobile && renderMobileNavigation()}

        {/* Notifications Side Panel */}
        <div className={`notifications-panel ${isNotificationsPanelOpen ? 'open' : ''}`}>
            <div className="notifications-header">
                <div className="notifications-tabs">
                    <button 
                        className={`notification-tab ${activeNotificationTab === 'friends' ? 'active' : ''}`}
                        onClick={() => setActiveNotificationTab('friends')}
                    >
                        FRIENDS
                    </button>
                    <button 
                        className={`notification-tab ${activeNotificationTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveNotificationTab('notifications')}
                    >
                        NOTIFICATIONS
                    </button>
                </div>
                <button className="notifications-close" onClick={toggleNotificationsPanel}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <div className="notifications-content">
                {activeNotificationTab === 'friends' && (
                    <div className="friends-tab-content">
                        <div className="club-invite-item">
                            <div className="club-invite-icon">
                                <FontAwesomeIcon icon={faUsers} />
                            </div>
                            <div className="club-invite-info">
                                <span className="club-invite-title">JOIN A CLUB</span>
                            </div>
                            <span className="beta-badge">BETA</span>
                        </div>
                        
                        {friendRequests.length > 0 && (
                            <div className="friend-requests-section">
                                <h4>Friend Requests</h4>
                                {friendRequests.map(request => (
                                    <div key={request.id} className="friend-request-item">
                                        <div className="friend-avatar">
                                            <FontAwesomeIcon icon={faUser} />
                                        </div>
                                        <div className="friend-info">
                                            <span className="friend-name">{request.from}</span>
                                            <span className="friend-status">Friend request</span>
                                        </div>
                                        <div className="friend-request-actions">
                                            <button 
                                                className="accept-btn"
                                                onClick={() => acceptFriendRequest(request.id)}
                                            >
                                                <FontAwesomeIcon icon={faCheck} />
                                            </button>
                                            <button 
                                                className="decline-btn"
                                                onClick={() => declineFriendRequest(request.id)}
                                            >
                                                <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="friends-list-section">
                            <h4>Friends ({friends.length})</h4>
                            {friends.map(friend => (
                                <div key={friend.id} className="friend-item">
                                    <div className="friend-avatar">
                                        <FontAwesomeIcon icon={faUser} />
                                    </div>
                                    <div className="friend-info">
                                        <span className="friend-name">{friend.name}</span>
                                        <span className={`friend-status ${friend.status}`}>
                                            {friend.status === 'online' ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                    <div className="friend-actions">
                                        <FontAwesomeIcon icon={faGamepad} title="Invite to game" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeNotificationTab === 'notifications' && (
                    <div className="notifications-tab-content">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <FontAwesomeIcon icon={faBell} />
                                <span>No new notifications</span>
                            </div>
                        ) : (
                            <div className="notifications-list">
                                {notifications.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                        onClick={() => markNotificationAsRead(notification.id)}
                                    >
                                        <div className="notification-icon">
                                            <FontAwesomeIcon icon={
                                                notification.type === 'friend_request' ? faUserPlus :
                                                notification.type === 'game_invite' ? faGamepad :
                                                notification.type === 'friend_accepted' ? faCheck :
                                                faBell
                                            } />
                                        </div>
                                        <div className="notification-content">
                                            <div className="notification-text">
                                                <strong>{notification.from}</strong> {notification.message}
                                            </div>
                                            <div className="notification-time">
                                                {formatTimeAgo(notification.timestamp)}
                                            </div>
                                        </div>
                                        {!notification.read && <div className="unread-dot"></div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Notifications Overlay */}
        {isNotificationsPanelOpen && (
            <div className="notifications-overlay" onClick={toggleNotificationsPanel}></div>
        )}

        {/* Add the LoginModal */}
        <LoginModal 
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onSuccess={handleLoginSuccess}
        />
    </header>
  );
};

export default AppHeader;
