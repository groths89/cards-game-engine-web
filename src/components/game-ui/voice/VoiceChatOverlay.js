import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faMicrophone, 
    faMicrophoneSlash,
    faVolumeUp,
    faVolumeMute
} from '@fortawesome/free-solid-svg-icons';
import './VoiceChatOverlay.css';

const VoiceChatOverlay = ({ 
    voiceUsers, 
    currentUserId, 
    socket, 
    roomCode,
    isDeafened 
}) => {
    const [speakingUsers, setSpeakingUsers] = useState(new Set());
    const audioContextRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        // Listen for speaking status updates
        socket.on('user_speaking', (data) => {
            const { userId, isSpeaking } = data;
            setSpeakingUsers(prev => {
                const newSet = new Set(prev);
                if (isSpeaking) {
                    newSet.add(userId);
                } else {
                    newSet.delete(userId);
                }
                return newSet;
            });
        });

        return () => {
            socket.off('user_speaking');
        };
    }, [socket]);

    const displayVoiceUsers = voiceUsers || [];

    if (displayVoiceUsers.length === 0) return null;

    return (
        <div className="voice-chat-overlay">
            {displayVoiceUsers.map(user => (
                <div 
                    key={user.id} 
                    className={`voice-user ${user.isSpeaking ? 'speaking' : ''} ${user.isMuted ? 'muted' : ''} ${user.id === currentUserId ? 'current-user' : ''}`}
                >
                    <div className="voice-user-avatar">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="voice-user-info">
                        <span className="voice-user-name">
                            {user.name || 'Unknown'}
                            {user.id === currentUserId && ' (You)'}
                        </span>
                        <div className="voice-user-status">
                            {user.isMuted && (
                                <FontAwesomeIcon icon={faMicrophoneSlash} className="muted-icon" />
                            )}
                            {user.id === currentUserId && isDeafened && (
                                <FontAwesomeIcon icon={faVolumeMute} className="deafened-icon" />
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VoiceChatOverlay;