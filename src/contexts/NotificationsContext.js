import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const [friends, setFriends] = useState([
    {
      id: 1,
      name: 'ContinentalGulf322',
      status: 'online',
      avatar: null,
      lastSeen: new Date()
    },
    {
      id: 2,
      name: 'CardMaster99',
      status: 'offline',
      avatar: null,
      lastSeen: new Date(Date.now() - 3600000) // 1 hour ago
    }
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'friend_request',
      from: 'NewPlayer123',
      message: 'sent you a friend request',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      read: false
    },
    {
      id: 2,
      type: 'game_invite',
      from: 'ContinentalGulf322',
      message: 'invited you to play Asshole',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      read: false,
      gameData: {
        gameType: 'asshole',
        roomCode: 'ABC123'
      }
    }
  ]);

  const [friendRequests, setFriendRequests] = useState([
    {
      id: 1,
      from: 'NewPlayer123',
      timestamp: new Date(Date.now() - 300000),
      status: 'pending'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length + friendRequests.length;

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const acceptFriendRequest = (requestId) => {
    const request = friendRequests.find(r => r.id === requestId);
    if (request) {
      // Add to friends list
      setFriends(prev => [...prev, {
        id: Date.now(),
        name: request.from,
        status: 'online',
        avatar: null,
        lastSeen: new Date()
      }]);
      
      // Remove from friend requests
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Add notification
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'friend_accepted',
        from: 'System',
        message: `You are now friends with ${request.from}`,
        timestamp: new Date(),
        read: false
      }]);
    }
  };

  const declineFriendRequest = (requestId) => {
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const sendGameInvite = (friendName, gameType, roomCode) => {
    console.log(`Sending game invite to ${friendName} for ${gameType} room ${roomCode}`);
  };

  return (
    <NotificationsContext.Provider value={{
      friends,
      notifications,
      friendRequests,
      unreadCount,
      markNotificationAsRead,
      acceptFriendRequest,
      declineFriendRequest,
      sendGameInvite
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};