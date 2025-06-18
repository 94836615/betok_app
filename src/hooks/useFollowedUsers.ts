// src/hooks/useFollowedUsers.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for followed users
const FOLLOWED_USERS_KEY = 'betok_followed_users';

// Global instance for app-wide access
let globalFollowedUsers: ReturnType<typeof useFollowedUsersInternal> | null = null;

// Internal hook implementation
function useFollowedUsersInternal() {
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved followed users on initial mount
  useEffect(() => {
    const loadFollowedUsers = async () => {
      try {
        const saved = await AsyncStorage.getItem(FOLLOWED_USERS_KEY);
        if (saved) {
          setFollowedUsers(JSON.parse(saved));
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load followed users:', error);
        setIsLoaded(true);
      }
    };

    loadFollowedUsers();
  }, []);

  // Save followed users whenever they change
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(FOLLOWED_USERS_KEY, JSON.stringify(followedUsers))
        .catch(error => console.error('Failed to save followed users:', error));
    }
  }, [followedUsers, isLoaded]);

  // Check if a user is followed
  const isUserFollowed = useCallback((userId: string) => {
    return !!followedUsers[userId];
  }, [followedUsers]);

  // Follow or unfollow a user
  const toggleFollowUser = useCallback(async (userId: string, shouldFollow: boolean) => {
    setFollowedUsers(prev => ({
      ...prev,
      [userId]: shouldFollow,
    }));

    try {
      // Call API to follow/unfollow user
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/users/${userId}/follow`,
        {
          method: shouldFollow ? 'POST' : 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          // Send your device ID as the follower
          body: JSON.stringify({
            follower_id: await AsyncStorage.getItem('betok_device_id_v1')
          }),
        }
      );

      if (!response.ok) {
        console.error(`Failed to ${shouldFollow ? 'follow' : 'unfollow'} user:`, response.status);
        // Revert the local state change if the API call fails
        setFollowedUsers(prev => ({
          ...prev,
          [userId]: !shouldFollow,
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error while ${shouldFollow ? 'following' : 'unfollowing'} user:`, error);
      // Revert the local state change if the API call fails
      setFollowedUsers(prev => ({
        ...prev,
        [userId]: !shouldFollow,
      }));
      return false;
    }
  }, []);

  // Get list of all followed user IDs
  const getFollowedUserIds = useCallback(() => {
    return Object.keys(followedUsers).filter(id => followedUsers[id]);
  }, [followedUsers]);

  return {
    isUserFollowed,
    toggleFollowUser,
    getFollowedUserIds,
    isLoaded,
  };
}

// Hook for component use
export function useFollowedUsers() {
  // If there's a global instance, use it
  if (globalFollowedUsers) {
    return globalFollowedUsers;
  }

  // Otherwise create a new instance
  const hookInstance = useFollowedUsersInternal();
  return hookInstance;
}

// Initialize global instance
export function initGlobalFollowedUsers(hook: ReturnType<typeof useFollowedUsersInternal>) {
  globalFollowedUsers = hook;
}

// Get global instance without React hooks
export function getGlobalFollowedUsers() {
  return globalFollowedUsers;
}
