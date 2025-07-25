import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export const amplifyDataService = {
  // User operations
  async createUser(userData) {
    try {
      const result = await client.models.User.create(userData);
      return result.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async getUser(userId) {
    try {
      const result = await client.models.User.get({ userId });
      return result.data;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  async updateUser(userId, updates) {
    try {
      const result = await client.models.User.update({
        userId,
        ...updates
      });
      return result.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Game history operations
  async saveGameHistory(gameData) {
    try {
      const result = await client.models.GameHistory.create(gameData);
      return result.data;
    } catch (error) {
      console.error('Error saving game history:', error);
      throw error;
    }
  },

  async getUserGameHistory(userId) {
    try {
      const result = await client.models.GameHistory.list({
        filter: { userId: { eq: userId } }
      });
      return result.data;
    } catch (error) {
      console.error('Error getting game history:', error);
      throw error;
    }
  }
};

