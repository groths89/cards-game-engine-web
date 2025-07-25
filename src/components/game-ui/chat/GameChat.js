import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPaperPlane, 
    faMicrophone, 
    faMicrophoneSlash,
    faVolumeUp,
    faVolumeMute,
    faComments,
    faTimes,
    faTrophy
} from '@fortawesome/free-solid-svg-icons';
import './GameChat.css';
import VoiceChatOverlay from '../voice/VoiceChatOverlay.js';
import { useAuth } from '../../../contexts/AuthContext';

const GameChat = ({ 
    socket, 
    roomCode, 
    chatHistory, 
    isVisible,
    onToggle,
    isMobile 
}) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [voiceUsers, setVoiceUsers] = useState([]);
    const { user } = useAuth(); 
    
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionsRef = useRef({});

    const audioContextRef = useRef(null);
    const analyserNodeRef = useRef(null);
    const microphoneInputNodeRef = useRef(null);
    const speakingTimeoutRef = useRef(null);
    const isSpeakingStateRef = useRef(false);

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    useEffect(() => {
        if (socket) {
            socket.on('typing_indicator', handleTypingIndicator);
            
            // Add debug listener for chat messages
            const debugChatListener = (data) => {
                console.log('GameChat: Received chat message directly:', data);
            };
            socket.on('receive_chat_message', debugChatListener);

            socket.on('voice_users_update', (users) => {
                console.log('GameChat: Received voice users update from backend:', users);
                setVoiceUsers(users);
            });
            
            return () => {
                socket.off('typing_indicator', handleTypingIndicator);
                socket.off('receive_chat_message', debugChatListener);
                socket.off('voice_users_update');

                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }

                if (speakingTimeoutRef.current) {
                    clearTimeout(speakingTimeoutRef.current);
                }
            };
        }
    }, [socket, roomCode]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleTypingIndicator = (data) => {
        if (data.is_typing) {
            setTypingUsers(prev => [...prev.filter(u => u !== data.sender), data.sender]);
        } else {
            setTypingUsers(prev => prev.filter(u => u !== data.sender));
        }
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        
        if (!isTyping && e.target.value.length > 0) {
            setIsTyping(true);
            socket?.emit('typing_indicator', {
                room_code: roomCode,
                is_typing: true
            });
        }

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket?.emit('typing_indicator', {
                room_code: roomCode,
                is_typing: false
            });
        }, 1000);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && socket && roomCode) {
            socket.emit('send_chat_message', {
                message: message.trim(),
                room_code: roomCode
            });
            setMessage('');
            setIsTyping(false);
            socket.emit('typing_indicator', {
                room_code: roomCode,
                is_typing: false
            });
        } else {
            console.log('GameChat: Cannot send message. Socket:', !!socket, 'RoomCode:', roomCode, 'Message:', message.trim());
        }
    };

    const processAudioStream = () => {
        if (!localStreamRef.current) {
            console.warn("No local audio stream available for speaking detection.");
            return;
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            microphoneInputNodeRef.current = audioContextRef.current.createMediaStreamSource(localStreamRef.current);
            analyserNodeRef.current = audioContextRef.current.createAnalyser();
            analyserNodeRef.current.fftSize = 256;
            microphoneInputNodeRef.current.connect(analyserNodeRef.current);
        }

        const bufferLength = analyserNodeRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const speakingThreshold = 10;
        const silenceThreshold = 5;
        const speakingDebounceMs = 200;
        const silenceDebounceMs = 500;

        const detectSpeaking = () => {
            if (!analyserNodeRef.current || !audioContextRef.current || audioContextRef.current.state === 'closed') {
                return;
            }

            analyserNodeRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            const isAudioActive = average > speakingThreshold;
            
            if (isAudioActive && !isSpeakingStateRef.current) {
                if (!speakingTimeoutRef.current) {
                    speakingTimeoutRef.current = setTimeout(() => {
                        isSpeakingStateRef.current = true;
                        socket?.emit('user_speaking', { room_code: roomCode, player_id: user?.userId, is_speaking: true });
                        speakingTimeoutRef.current = null;
                    }, speakingDebounceMs);
                }
            } else if (!isAudioActive && isSpeakingStateRef.current) {
                if (!speakingTimeoutRef.current) {
                    speakingTimeoutRef.current = setTimeout(() => {
                        isSpeakingStateRef.current = false;
                        socket?.emit('user_speaking', { room_code: roomCode, player_id: user?.userId, is_speaking: false });
                        speakingTimeoutRef.current = null;
                    }, silenceDebounceMs);
                }
            } else if (isAudioActive && isSpeakingStateRef.current) {
                if (speakingTimeoutRef.current) {
                    clearTimeout(speakingTimeoutRef.current);
                    speakingTimeoutRef.current = null;
                }
            } else if (!isAudioActive && !isSpeakingStateRef.current) {
                 if (speakingTimeoutRef.current) {
                    clearTimeout(speakingTimeoutRef.current);
                    speakingTimeoutRef.current = null;
                }
            }

            requestAnimationFrame(detectSpeaking);
        };

        detectSpeaking();
    };

    const initVoiceChat = async () => {
        if (!user || typeof user.userId === 'undefined' || typeof user.username === 'undefined') {
            console.error("User data missing or incomplete for voice chat. User object:", user);
            alert("Authentication required for voice chat. Please log in.");
            return; // Exit if user data isn't complete
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            setIsVoiceChatEnabled(true); 

            socket?.emit('join_voice_chat', {
                room_code: roomCode,
                player_id: user.userId,   // Now we are sure user.userId exists
                user_name: user.username // Now we are sure user.username exists
            });

            processAudioStream();
        } catch (error) {
            console.error('Error accessing microphone:', error); // This is for getUserMedia errors
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const leaveVoiceChat = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;

            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }

            if (analyserNodeRef.current) analyserNodeRef.current = null;
            if (microphoneInputNodeRef.current) microphoneInputNodeRef.current = null;
            if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current);
                speakingTimeoutRef.current = null;
            }

            if (isSpeakingStateRef.current) {
                socket?.emit('user_speaking', { room_code: roomCode, player_id: user?.userId, is_speaking: false });
                isSpeakingStateRef.current = false;
            }
        }
        
        Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
        peerConnectionsRef.current = {};
        
        setIsVoiceChatEnabled(false);
        setIsMuted(false);
        socket?.emit('leave_voice_chat', { room_code: roomCode });
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);

                socket?.emit('toggle_mute_voice', {
                    room_code: roomCode
                });
            }
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <>
            <VoiceChatOverlay
                voiceUsers={voiceUsers}
                currentUserId={socket?.id}
                socket={socket}
                roomCode={roomCode}
                isDeafened={isDeafened}
            />
            
            {!isVisible ? (
                <button 
                    className={`chat-toggle-button ${isMobile ? 'mobile' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setTimeout(() => {
                            onToggle();
                        }, 0);
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <FontAwesomeIcon icon={faComments} />
                    {chatHistory.length > 0 && (
                        <span className="chat-notification-badge">{chatHistory.length}</span>
                    )}
                </button>
            ) : (
                <div className={`game-chat ${isMobile ? 'mobile' : ''}`}>
                    <div className="chat-header">
                        <div className="chat-title">
                            <FontAwesomeIcon icon={faComments} />
                            <span>Chat</span>
                        </div>
                        <div className="chat-controls">
                            {!isVoiceChatEnabled ? (
                                <button 
                                    className="voice-chat-button"
                                    onClick={initVoiceChat}
                                    title="Join Voice Chat"
                                >
                                    <FontAwesomeIcon icon={faMicrophone} />
                                </button>
                            ) : (
                                <div className="voice-controls">
                                    <button 
                                        className={`voice-control-button ${isMuted ? 'muted' : ''}`}
                                        onClick={toggleMute}
                                        title={isMuted ? 'Unmute' : 'Mute'}
                                    >
                                        <FontAwesomeIcon icon={isMuted ? faMicrophoneSlash : faMicrophone} />
                                    </button>
                                    <button 
                                        className={`voice-control-button ${isDeafened ? 'deafened' : ''}`}
                                        onClick={() => setIsDeafened(!isDeafened)}
                                        title={isDeafened ? 'Undeafen' : 'Deafen'}
                                    >
                                        <FontAwesomeIcon icon={isDeafened ? faVolumeMute : faVolumeUp} />
                                    </button>
                                    <button 
                                        className="voice-control-button leave"
                                        onClick={leaveVoiceChat}
                                        title="Leave Voice Chat"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                            )}
                            <button 
                                className="chat-close-button" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onToggle();
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {chatHistory.map((msg, index) => (
                            <div key={index} className="chat-message">
                                <div className="message-header">
                                    <span className="message-sender">{msg.sender}</span>
                                    {msg.senderProfile?.gamesWon > 0 && (
                                        <span className="sender-wins">
                                            <FontAwesomeIcon icon={faTrophy} />
                                            {msg.senderProfile.gamesWon}
                                        </span>
                                    )}
                                    <span className="message-time">
                                        {msg.timestamp ? formatTime(msg.timestamp) : ''}
                                    </span>
                                </div>
                                <div className="message-content">{msg.message}</div>
                            </div>
                        ))}
                        
                        {typingUsers.length > 0 && (
                            <div className="typing-indicator">
                                <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-form" onSubmit={sendMessage}>
                        <input
                            type="text"
                            value={message}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            className="chat-input"
                            maxLength={200}
                        />
                        <button 
                            type="submit" 
                            className="chat-send-button"
                            disabled={!message.trim()}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default GameChat;
