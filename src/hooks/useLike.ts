// src/hooks/useLike.ts
import { useState, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseLikeOptions {
  initialLiked?: boolean;
  initialCount?: number;
  videoId?: string;
  onLikeCallback?: (videoId: string, isLiked: boolean) => Promise<boolean>;
}

// Prefix for storage keys to avoid collisions
const LIKE_STATE_PREFIX = 'video_like_';
const LIKE_COUNT_PREFIX = 'video_like_count_';

export const useLike = ({
  initialLiked = false,
  initialCount = 0,
  videoId = '',
  onLikeCallback
}: UseLikeOptions = {}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Animation value
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Load saved like state and count on mount
  useEffect(() => {
    const loadLikeState = async () => {
      if (!videoId) return;

      try {
        // Load like state (true/false)
        const stateKey = `${LIKE_STATE_PREFIX}${videoId}`;
        const savedLike = await AsyncStorage.getItem(stateKey);

        // Load like count
        const countKey = `${LIKE_COUNT_PREFIX}${videoId}`;
        const savedCount = await AsyncStorage.getItem(countKey);

        // Update state with stored values
        if (savedLike !== null) {
          setIsLiked(savedLike === 'true');
        }

        if (savedCount !== null) {
          setLikeCount(parseInt(savedCount, 10));
        } else if (initialCount > 0) {
          // If no saved count but we have an initial count, use that
          setLikeCount(initialCount);

          // And store it
          await AsyncStorage.setItem(countKey, initialCount.toString());
        }
      } catch (err) {
        console.error('Error loading like state:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    loadLikeState();
  }, [videoId, initialCount]);

  // Save like state and count when they change
  useEffect(() => {
    const saveLikeState = async () => {
      if (!videoId || !isInitialized) return;

      try {
        // Save both the like state and count
        const stateKey = `${LIKE_STATE_PREFIX}${videoId}`;
        const countKey = `${LIKE_COUNT_PREFIX}${videoId}`;

        await AsyncStorage.setItem(stateKey, String(isLiked));
        await AsyncStorage.setItem(countKey, String(likeCount));

        console.log(`Saved like state for ${videoId}: ${isLiked}, count: ${likeCount}`);
      } catch (err) {
        console.error('Error saving like state:', err);
      }
    };

    saveLikeState();
  }, [isLiked, likeCount, videoId, isInitialized]);

  // Format count for display (e.g., 3200 -> 3.2K)
  const formattedCount = useCallback((count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }, []);

  // Animation sequence
  const animateLike = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim]);

  // Update count when initialCount changes
  useEffect(() => {
    if (initialCount > 0 && !isInitialized) {
      setLikeCount(initialCount);
    }
  }, [initialCount, isInitialized]);

  // Handle like toggle
  const toggleLike = useCallback(async () => {
    if (isLoading) return;

    // Clear any previous errors
    setError(null);

    // Start animation
    animateLike();

    try {
      setIsLoading(true);

      // Toggle like state
      const newLikedState = !isLiked;

      // Calculate new count
      const newLikeCount = newLikedState
        ? likeCount + 1
        : Math.max(0, likeCount - 1);

      // Update UI immediately for better UX (optimistic update)
      setLikeCount(newLikeCount);
      setIsLiked(newLikedState);

      // Call API if callback provided
      if (onLikeCallback && videoId) {
        const success = await onLikeCallback(videoId, newLikedState);

        // If API call failed, revert UI changes
        if (!success) {
          setIsLiked(!newLikedState);
          setLikeCount(newLikedState ? newLikeCount - 1 : newLikeCount + 1);
          setError('Failed to update like status');

          // Auto-clear error after 3 seconds
          setTimeout(() => setError(null), 3000);
        } else {
          // Store the updated count in AsyncStorage
          const countKey = `${LIKE_COUNT_PREFIX}${videoId}`;
          await AsyncStorage.setItem(countKey, String(newLikeCount));
        }
      }
    } catch (err) {
      // Revert changes on error
      const newLikedState = !isLiked;
      setIsLiked(!newLikedState);
      setLikeCount(newLikedState ? likeCount - 1 : likeCount + 1);

      // Set error message
      console.error('Like toggle error:', err);
      setError('Could not update like status');

      // Auto-clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [isLiked, likeCount, isLoading, videoId, onLikeCallback, animateLike]);

  return {
    isLiked,
    likeCount,
    formattedCount: formattedCount(likeCount),
    isLoading,
    error,
    toggleLike,
    scaleAnim
  };
};
