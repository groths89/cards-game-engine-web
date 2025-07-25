import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/LocalAuthContext';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        confirmationCode: ''
    });

    const { signIn, signUp } = useAuth();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn(formData.email, formData.password);
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const result = await signUp(formData.email, formData.password, formData.username);
            if (result.success) {
                setMode('login');
                setError('Account created! Please log in.');
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // For local development, skip confirmation
        setMode('login');
        setError('Account confirmed! Please log in.');
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="login-modal-overlay">
            <div className="login-modal">
                <button className="login-modal-close" onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <div className="login-modal-header">
                    <h2>
                        {mode === 'login' && 'Welcome Back!'}
                        {mode === 'signup' && 'Join Greg\'s Games'}
                        {mode === 'confirm' && 'Confirm Your Account'}
                    </h2>
                </div>

                {error && <div className="login-error">{error}</div>}

                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group password-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                        <button type="submit" className="login-submit" disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                        <p className="login-switch">
                            Don't have an account?{' '}
                            <button type="button" onClick={() => setMode('signup')}>
                                Sign Up
                            </button>
                        </p>
                    </form>
                )}

                {mode === 'signup' && (
                    <form onSubmit={handleSignUp} className="login-form">
                        <div className="form-group">
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group password-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <button type="submit" className="login-submit" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                        <p className="login-switch">
                            Already have an account?{' '}
                            <button type="button" onClick={() => setMode('login')}>
                                Sign In
                            </button>
                        </p>
                    </form>
                )}

                {mode === 'confirm' && (
                    <form onSubmit={handleConfirmSignUp} className="login-form">
                        <p>Please enter the confirmation code sent to {formData.email}</p>
                        <div className="form-group">
                            <input
                                type="text"
                                name="confirmationCode"
                                placeholder="Confirmation Code"
                                value={formData.confirmationCode}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <button type="submit" className="login-submit" disabled={loading}>
                            {loading ? 'Confirming...' : 'Confirm Account'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginModal;

