// src/components/FollowButton.tsx
import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FollowButtonProps {
  userId: string;
  onToggleFollow: (userId: string, shouldFollow: boolean) => Promise<boolean>;
  style?: any;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  onToggleFollow,
  style,
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we're already following this user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!userId) return;

      try {
        const status = await AsyncStorage.getItem(`user_follow_${userId}`);
        setIsFollowing(status === 'true');
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [userId]);

  const handlePress = async () => {
    if (isLoading || !userId) return;

    setIsLoading(true);
    try {
      // Call the parent component's toggle function
      const success = await onToggleFollow(userId, !isFollowing);

      if (success) {
        // Update local state
        setIsFollowing(!isFollowing);
        // Store follow state in AsyncStorage
        await AsyncStorage.setItem(`user_follow_${userId}`, String(!isFollowing));
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFollowing ? styles.followingButton : styles.followButton,
        style,
      ]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFF" />
      ) : (
        <Text style={styles.buttonText}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  followButton: {
    backgroundColor: '#FF5A5F',
  },
  followingButton: {
    backgroundColor: '#555',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default FollowButton;
