/**
 * VideoManager - Utility for managing video resources efficiently
 * Helps prevent memory leaks and app crashes when loading multiple videos
 */

// Maximum number of videos that can be loaded at once
const MAX_CONCURRENT_VIDEOS = 3;

// Track loaded videos
let loadedVideos: string[] = [];

/**
 * Register a video as being loaded
 * @param videoUrl The URL of the video being loaded
 * @returns boolean - Whether the video can be loaded (based on current memory constraints)
 */
export const registerVideoLoad = (videoUrl: string): boolean => {
  // Check if we're at the limit
  if (
    loadedVideos.length >= MAX_CONCURRENT_VIDEOS &&
    !loadedVideos.includes(videoUrl)
  ) {
    console.warn(
      `Reached maximum concurrent video limit (${MAX_CONCURRENT_VIDEOS}). Consider unloading some videos.`,
    );
    return false;
  }

  // If not already registered, add to loaded videos
  if (!loadedVideos.includes(videoUrl)) {
    loadedVideos.push(videoUrl);
  }

  return true;
};

/**
 * Unregister a video when it's no longer being viewed
 * @param videoUrl The URL of the video to unregister
 */
export const unregisterVideo = (videoUrl: string): void => {
  loadedVideos = loadedVideos.filter(url => url !== videoUrl);
};

/**
 * Get the number of currently loaded videos
 */
export const getLoadedVideoCount = (): number => {
  return loadedVideos.length;
};

/**
 * Clear all loaded videos (useful when navigating away)
 */
export const clearAllVideos = (): void => {
  loadedVideos = [];
};

/**
 * Check if a video can be loaded
 */
export const canLoadVideo = (videoUrl: string): boolean => {
  return (
    loadedVideos.includes(videoUrl) ||
    loadedVideos.length < MAX_CONCURRENT_VIDEOS
  );
};

export default {
  registerVideoLoad,
  unregisterVideo,
  getLoadedVideoCount,
  clearAllVideos,
  canLoadVideo,
};
