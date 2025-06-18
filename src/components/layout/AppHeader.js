import React, { useState, useEffect, useRef } from 'react';
import { Route, Routes, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, 
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
         faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import './AppHeader.css';
import logo from '../../assets/gregs-games-social-logo-v3.png';

const AppHeader = ({isMobile, isMenuOpen, onMenuToggle}) => {
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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (gamesDropdownRef.current && !gamesDropdownRef.current.contains(event.target)) {
                setIsGamesDropdownOpen(false);
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
        }
    }, [isMenuOpen]);

    const [isGamesDropdownOpen, setIsGamesDropdownOpen] = useState(false);
    const gamesDropdownRef = useRef(null);

  return (
        <header className={`app-header ${isMenuOpen ? 'mobile-menu-open' : ''}`}>
            {!isMobile && (
                <>
                    <div className="header-left-section">
                        <Link to="/" className="app-logo-link">
                            <img src={logo} alt="Greg's Games Social Logo" className="app-logo" />
                        </Link>
                        <nav className="main-nav">
                            <ul>
                                <li className="nav-item-dropdown" ref={gamesDropdownRef}>
                                    <button
                                        className={`nav-dropdown-toggle ${isGamesDropdownOpen || location.pathname.startsWith('/lobby/') || location.pathname.startsWith('/game/') ? 'active-dropdown-toggle' : ''}`}
                                    >
                                        Games
                                        <FontAwesomeIcon icon={isGamesDropdownOpen ? faChevronUp : faChevronDown} className="dropdown-icon" />
                                    </button>
                                    <ul className={`dropdown-menu`}>
                                        <li>
                                            <Link
                                                to="/lobby/asshole"
                                                className={isActive('/lobby/asshole') ? 'active' : ''}
                                                onClick={() => setIsGamesDropdownOpen(false)}
                                            >
                                                <div className="dropdown-item-content">
                                                    <img src="https://placehold.co/50x50/8a2be2/ffffff?text=GAME" alt="Game Icon" className="dropdown-item-image" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/50x50/cccccc/000000?text=Err"; }} />
                                                    <div className="dropdown-item-text">
                                                        <span className="dropdown-item-title">Asshole Lobby</span>
                                                        <span className="dropdown-item-description">Join or create a game of Asshole.</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </li>
                                    </ul>
                                </li>
                                {/* Other direct navigation links for desktop */}
                                {/*<li><Link to="#"></Link></li>
                                <li><Link to="#"></Link></li>
                                <li><Link to="#"></Link></li>*/}
                            </ul>
                        </nav>
                    </div>

                    {/* Right Section for Desktop -- [FUTURE IMPLEMENTATION] */}
                    {/*<div className="header-right-section">
                        <div className="header-icon-button"><FontAwesomeIcon icon={faSearch} /></div>
                        <div className="user-profile-widget">
                            <div className="user-avatar"></div>
                            <span className="user-name"></span>
                            <FontAwesomeIcon icon={faCaretDown} className="user-dropdown-icon" />
                        </div>
                        <div className="header-icon-button">
                            <FontAwesomeIcon icon={faBell} />
                            <span className="notification-badge"></span>
                        </div>
                    </div> */}
                </>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
                <div className="mobile-header-bar">
                    <Link to="/" className="app-logo-link" onClick={onMenuToggle}>
                        <img src={logo} alt="Greg's Games Social Logo" className="app-logo" />
                    </Link>
                    <div className="mobile-header-right-icons">
                        {/* Right Section for Mobile -- [FUTURE IMPLEMENTATION] */}
                         {/*<div className="header-icon-button"><FontAwesomeIcon icon={faSearch} /></div>
                        <div className="header-icon-button"><FontAwesomeIcon icon={faBell} /></div>*/}
                        <button className="menu-button" onClick={onMenuToggle}>
                            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Slide-in Menu Panel */}
            {isMobile && (
                <div className={`mobile-menu-panel ${isMenuOpen ? 'open' : ''}`}>
                    <div className="mobile-menu-header">
                        <Link to="/" className="app-logo-link" onClick={onMenuToggle}>
                        <img src={logo} alt="Greg's Games Social Logo" className="app-logo" />
                        </Link>
                        <button className="mobile-menu-close-button" onClick={onMenuToggle}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    <nav className="mobile-main-nav">
                        <div className="menu-category">
                            <span className="category-title">MULTIPLAYER</span>
                            <ul>
                                <li>
                                    <Link to="/lobby/asshole" className={isActive('/lobby/asshole') ? 'active' : ''} onClick={onMenuToggle}>
                                        <div className="menu-item-content">
                                            <FontAwesomeIcon icon={faHandPaper} className="menu-item-icon" />
                                            <div className="menu-item-text">
                                                <span className="menu-item-title">Asshole Lobby</span>
                                                <span className="menu-item-description">Join or create a game of Asshole.</span>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                                {/* <li className="menu-separator"></li> */}
                            </ul>
                        </div>
                        {/* Additional categories could go here */}
                        {/*<div className="menu-category">
                            <span className="category-title">OTHER</span>
                            <ul>
                                <li><Link to="#" onClick={onMenuToggle}></Link></li>
                                <li><Link to="#" onClick={onMenuToggle}></Link></li>
                                <li><Link to="#" onClick={onMenuToggle}></Link></li>
                            </ul>
                        </div> */}
                    </nav>
                </div>
            )}
        </header>
  );
};

export default AppHeader;