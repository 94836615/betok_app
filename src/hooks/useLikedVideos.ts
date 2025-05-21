// src/hooks/useLikedVideos.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for liked videos
const LIKED_VIDEOS_KEY = 'betok_liked_videos';

// Hook for liked videos state management
export function useLikedVideos() {
  // State to track which videos have been liked
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved likes on initial mount
  useEffect(() => {
    const loadLikedVideos = async () => {
      try {
        const saved = await AsyncStorage.getItem(LIKED_VIDEOS_KEY);
        if (saved) {
          setLikedVideos(JSON.parse(saved));
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load liked videos:', error);
        setIsLoaded(true);
      }
    };

    loadLikedVideos();
  }, []);

  // Save likes whenever they change
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(LIKED_VIDEOS_KEY, JSON.stringify(likedVideos))
        .catch(error => console.error('Failed to save liked videos:', error));
    }
  }, [likedVideos, isLoaded]);

  // Check if a video is liked
  const isVideoLiked = useCallback((videoId: string) => {
    return !!likedVideos[videoId];
  }, [likedVideos]);

  // Set a video as liked/unliked
  const setVideoLiked = useCallback((videoId: string, liked: boolean) => {
    setLikedVideos(prev => ({
      ...prev,
      [videoId]: liked,
    }));
  }, []);

  return {
    isVideoLiked,
    setVideoLiked,
    isLoaded,
  };
}

// Create a global instance for app-wide access
let globalLikedVideos: {
  isVideoLiked: (videoId: string) => boolean;
  setVideoLiked: (videoId: string, liked: boolean) => void;
  isLoaded: boolean;
} | null = null;

export function getGlobalLikedVideos() {
  return globalLikedVideos;
}

export function initGlobalLikedVideos(hook: ReturnType<typeof useLikedVideos>) {
  globalLikedVideos = hook;
}
