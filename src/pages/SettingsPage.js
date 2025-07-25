import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faVolumeUp, faPalette, faUser, faBell, faGamepad } from '@fortawesome/free-solid-svg-icons';
import './SettingsPage.css';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    // Audio Settings
    masterVolume: 70,
    soundEffects: true,
    backgroundMusic: true,
    voiceChat: true,
    
    // Visual Settings
    theme: 'dark',
    animations: true,
    cardAnimations: true,
    
    // Gameplay Settings
    autoPass: false,
    confirmActions: true,
    showHints: true,
    
    // Notification Settings
    gameNotifications: true,
    turnNotifications: true,
    chatNotifications: true,
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    if (window.confirm('Reset all settings to default values?')) {
      const defaultSettings = {
        masterVolume: 70,
        soundEffects: true,
        backgroundMusic: true,
        voiceChat: true,
        theme: 'dark',
        animations: true,
        cardAnimations: true,
        autoPass: false,
        confirmActions: true,
        showHints: true,
        gameNotifications: true,
        turnNotifications: true,
        chatNotifications: true,
      };
      setSettings(defaultSettings);
    }
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <h1><FontAwesomeIcon icon={faCog} /> Settings</h1>
        
        <div className="settings-sections">
          {/* Audio Settings */}
          <div className="settings-section">
            <h2><FontAwesomeIcon icon={faVolumeUp} /> Audio</h2>
            
            <div className="setting-item">
              <label>Master Volume</label>
              <div className="volume-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.masterVolume}
                  onChange={(e) => handleSettingChange('masterVolume', parseInt(e.target.value))}
                />
                <span>{settings.masterVolume}%</span>
              </div>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                />
                Sound Effects
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.backgroundMusic}
                  onChange={(e) => handleSettingChange('backgroundMusic', e.target.checked)}
                />
                Background Music
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.voiceChat}
                  onChange={(e) => handleSettingChange('voiceChat', e.target.checked)}
                />
                Voice Chat
              </label>
            </div>
          </div>

          {/* Visual Settings */}
          <div className="settings-section">
            <h2><FontAwesomeIcon icon={faPalette} /> Visual</h2>
            
            <div className="setting-item">
              <label>Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.animations}
                  onChange={(e) => handleSettingChange('animations', e.target.checked)}
                />
                UI Animations
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.cardAnimations}
                  onChange={(e) => handleSettingChange('cardAnimations', e.target.checked)}
                />
                Card Animations
              </label>
            </div>
          </div>

          {/* Gameplay Settings */}
          <div className="settings-section">
            <h2><FontAwesomeIcon icon={faGamepad} /> Gameplay</h2>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoPass}
                  onChange={(e) => handleSettingChange('autoPass', e.target.checked)}
                />
                Auto-pass when no valid moves
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.confirmActions}
                  onChange={(e) => handleSettingChange('confirmActions', e.target.checked)}
                />
                Confirm important actions
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showHints}
                  onChange={(e) => handleSettingChange('showHints', e.target.checked)}
                />
                Show gameplay hints
              </label>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="settings-section">
            <h2><FontAwesomeIcon icon={faBell} /> Notifications</h2>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.gameNotifications}
                  onChange={(e) => handleSettingChange('gameNotifications', e.target.checked)}
                />
                Game start/end notifications
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.turnNotifications}
                  onChange={(e) => handleSettingChange('turnNotifications', e.target.checked)}
                />
                Turn notifications
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.chatNotifications}
                  onChange={(e) => handleSettingChange('chatNotifications', e.target.checked)}
                />
                Chat notifications
              </label>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="reset-button" onClick={resetToDefaults}>
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
