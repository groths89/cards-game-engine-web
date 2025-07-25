import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const AuthModal = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState('login'); // 'login' or 'signup'

    if (!isOpen) return null;

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal">
                <button onClick={onClose}>×</button>
                
                {mode === 'login' ? (
                    <LoginForm onClose={onClose} />
                ) : (
                    <SignupForm onClose={onClose} />
                )}
                
                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                    {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Login'}
                </button>
            </div>
        </div>
    );
};

export default AuthModal;