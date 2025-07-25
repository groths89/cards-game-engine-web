import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppHeader from '../layout/AppHeader';
import { AuthProvider } from '../../contexts/AuthContext';
import { GameProvider } from '../../contexts/GameContext';
import { NotificationsProvider } from '../../contexts/NotificationsContext';

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <GameProvider>
        <NotificationsProvider>
          {children}
        </NotificationsProvider>
      </GameProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('AppHeader', () => {
  test('renders app header with logo', () => {
    render(
      <TestWrapper>
        <AppHeader />
      </TestWrapper>
    );
    
    expect(screen.getByText("Greg's Games")).toBeInTheDocument();
  });

  test('shows sign in button when not authenticated', () => {
    render(
      <TestWrapper>
        <AppHeader />
      </TestWrapper>
    );
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('mobile menu button toggles menu', () => {
    render(
      <TestWrapper>
        <AppHeader />
      </TestWrapper>
    );
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });
    
    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);
    
    // Check if menu is opened (you might need to adjust this based on your implementation)
    expect(document.body).toHaveClass('mobile-menu-open');
  });
});