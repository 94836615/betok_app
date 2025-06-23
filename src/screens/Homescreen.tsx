import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
  ViewToken,
  TouchableWithoutFeedback,
} from 'react-native';
import ProfileHeader from '../components/ProfileHeader.tsx';
import VideoCard from '../components/VideoCard.tsx';
import VideoManager from '../utils/VideoManager.ts';
// New import at the top of Homescreen.tsx
import { getDeviceId } from '../utils/user-utils.ts';
// In Homescreen.tsx, add these imports
import { useLikedVideos, initGlobalLikedVideos } from '../hooks/useLikedVideos';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Add these imports at the top of Homescreen.tsx
import { InteractionManager } from 'react-native';
// Import CommentModal
import CommentModal from '../components/CommentModal.tsx';
// Import share utilities
import { shareVideo } from '../utils/share-utils.ts';

const {height} = Dimensions.get('window');

interface VideoItem {
  id: string;
  url: string;
  filename: string;
  caption?: string;
  created_at: string;
}

const Homescreen: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const currentIndexRef = React.useRef(0);
  const lastFetchTimeRef = React.useRef(0);
  const [loadedVideoIds, setLoadedVideoIds] = useState<Set<string>>(
      new Set(),
  );
  const [visibleVideoIndex, setVisibleVideoIndex] = useState<
      number | null
  >(null);
  const [isPaused, setIsPaused] = useState(false);
  // Add this state at the top of your Homescreen component
  const [resetKey, setResetKey] = useState(0);
  // Add this state
  const [swipeCount, setSwipeCount] = useState(0);

  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentCommentVideoId, setCurrentCommentVideoId] = useState<string>('');

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const keyExtractor = React.useCallback((item: VideoItem, index: number) => {
    return `${item.id}-${index}`;
  }, []);

  const fetchVideos = React.useCallback(async () => {
    if (loading || !hasMore) {
      console.log('Skip fetch: loading =', loading, 'hasMore =', hasMore);
      console.log(`Memory state before fetch: ${videos.length} videos in state, showing index ${visibleVideoIndex}`);
      return;
    }

    // Prevent rapid successive calls
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) {
      console.log('Skipping fetch - too soon since last fetch');
      return;
    }
    lastFetchTimeRef.current = now;

    try {
      console.log('Fetching videos at offset:', offset);
      setLoading(true);

      const res = await fetch(
          `http://127.0.0.1:8000/api/v1/videos?limit=2&offset=${offset}`,
      );
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        console.log('No more videos available');
        setHasMore(false);
        return;
      }

      // Create a copy of the current loaded IDs
      const currentIds = new Set([...loadedVideoIds]);

      // Filter out videos we've already loaded
      const newVideos = data.filter(video => !currentIds.has(video.id));
      console.log(`Found ${newVideos.length} new videos of ${data.length} fetched`);

      if (newVideos.length === 0) {
        // We received data but all videos were duplicates
        console.log('All fetched videos are duplicates, stopping pagination');
        setHasMore(false);
        return;
      }

      // Add new video IDs to our tracking Set
      newVideos.forEach(video => currentIds.add(video.id));
      setLoadedVideoIds(currentIds);

      // Update the videos array with new content
      setVideos(prev => [...prev, ...newVideos]);

      // Update offset for next API call
      setOffset(prev => prev + data.length);
    } catch (err) {
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, loadedVideoIds]);

  // Initial load
  React.useEffect(() => {
    fetchVideos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,  // Reduce from 90 to 50
    minimumViewTime: 100,  // Add minimum view time
  }).current;

  // Then modify onViewableItemsChanged
  const onViewableItemsChanged = React.useRef(
  ({viewableItems}: {viewableItems: ViewToken[]}) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0;
      const previousIndex = visibleVideoIndex;

      console.log(`Viewable items changed: now showing index ${index}`);

      if (previousIndex !== null && previousIndex !== index) {
        // Track the swipe but don't do aggressive cleanup
        console.log(`[Swipe] Moving from ${previousIndex} to ${index}`);

        // Increment swipe count more safely (without causing state updates during render)
        setTimeout(() => {
          setSwipeCount(prevCount => {
            const newCount = prevCount + 1;
            console.log(`Updated swipe count: ${newCount}`);
            return newCount;
          });
        }, 0);
      }

      // Update visible index
      setVisibleVideoIndex(index);
      currentIndexRef.current = index;
    }
  }
).current;

  // Initialize global liked videos state
  const likedVideosStore = useLikedVideos();

  // Initialize global reference on mount
  React.useEffect(() => {
    initGlobalLikedVideos(likedVideosStore);
  }, [likedVideosStore]);

  // Handler for comment icon press
  const handleCommentPress = (videoId: string) => {
    setCurrentCommentVideoId(videoId);
    setCommentModalVisible(true);
  };

  // Handler for share icon press
  const handleSharePress = React.useCallback((videoUrl: string) => {
    console.log(`Sharing video URL: ${videoUrl}`);
    shareVideo(videoUrl);
  }, []);

  // Handler for posting comments
  const handleCommentSubmit = async (videoId: string, comment: string): Promise<boolean> => {
    try {
      console.log(`Posting comment for video ${videoId}: ${comment}`);

      // Get the device ID
      const deviceId = await getDeviceId();
      console.log('Device ID:', deviceId);

      // Create the appropriate URL for posting comments
      const url = `http://127.0.0.1:8000/api/v1/videos/${videoId}/comments`;

      console.log(`Sending POST request to ${url}`);

      // Make the API call to your backend
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: deviceId,
          content: comment
        }),
      });

      // Log the response status
      console.log('Response status:', response.status);

      if (!response.ok) {
        // Try to get the error details
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('Error response:', errorText);
        } catch (e) {
          console.error('Could not read error response');
        }

        throw new Error(`Failed to post comment: ${response.status}`);
      }

      // Parse response
      const data = await response.json();
      console.log('Response data:', data);

      // Update the videos array with the new comment count
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId
            ? {
                ...video,
                comment_count: (video.comment_count || 0) + 1
              }
            : video
        )
      );

      // Fetch the updated comment count from the API
      try {
        const countResponse = await fetch(`http://127.0.0.1:8000/api/v1/videos/${videoId}/comments/count`);
        if (countResponse.ok) {
          const countData = await countResponse.json();
          if (countData.count !== undefined) {
            // Update with the accurate count from the server
            setVideos(prevVideos =>
              prevVideos.map(video =>
                video.id === videoId
                  ? { ...video, comment_count: countData.count }
                  : video
              )
            );
          }
        }
      } catch (countErr) {
        console.error('Error fetching updated comment count:', countErr);
        // Continue with the optimistic update if this fails
      }

      return data.success || true;
    } catch (err) {
      console.error('Error posting comment:', err);
      return false;
    }
  };

  const handleLikeToggle = React.useCallback(async (videoId: string, isLiked: boolean): Promise<boolean> => {
    try {
      console.log(`Toggling like for video ${videoId}: ${isLiked ? 'liked' : 'unliked'}`);

      // Get the device ID
      const deviceId = await getDeviceId();
      console.log('Device ID:', deviceId);

      // Create the appropriate URL and method based on the action
      const url = `http://127.0.0.1:8000/api/v1/videos/${videoId}/like`;
      const method = isLiked ? 'POST' : 'DELETE';

      console.log(`Sending ${method} request to ${url}`);

      // Make the API call to your backend
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceId), // Send the deviceId as the raw body
      });

      // Log the response status
      console.log('Response status:', response.status);

      if (!response.ok) {
        // Try to get the error details
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('Error response:', errorText);
        } catch (e) {
          console.error('Could not read error response');
        }

        throw new Error(`Failed to update like: ${response.status}`);
      }

      // Parse response
      const data = await response.json();
      console.log('Response data:', data);

      // Also store the like state in AsyncStorage for persistence
      const storageKey = `video_like_${videoId}`;
      await AsyncStorage.setItem(storageKey, String(isLiked));

      return data.success || true;
    } catch (err) {
      console.error('Error toggling like:', err);
      return false;
    }
  }, []);

  // Pass this to your VideoCard in renderItem
  const renderItem = React.useCallback(({item, index}) => {
    // Existing renderItem code...

    return (
      <View style={styles.videoPage}>
        <TouchableWithoutFeedback onPress={togglePause}>
          <View style={styles.videoContainer}>
            <VideoCard
              url={item.url}
              isVisible={index === visibleVideoIndex && !isPaused}
              id={item.id}
              likeCount={item.like_count}
              commentCount={item.comment_count || 0}
              onLikeToggle={handleLikeToggle}
              onCommentPress={handleCommentPress}
              onSharePress={handleSharePress}
            />
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.headerOverlay}>
          <ProfileHeader />
        </View>
      </View>
    );
  }, [handleLikeToggle, handleCommentPress, handleSharePress, isPaused, visibleVideoIndex]);

  // Inside the Homescreen component, add this useEffect hook
  React.useEffect(() => {
    // Set up memory usage monitoring
    let memoryMonitoringInterval: NodeJS.Timeout;

    const startMemoryMonitoring = () => {
      memoryMonitoringInterval = setInterval(() => {
        if (global.performance && global.performance.memory) {
          const { usedJSHeapSize, totalJSHeapSize } = global.performance.memory;
          const usedMB = Math.round(usedJSHeapSize / (1024 * 1024));
          const totalMB = Math.round(totalJSHeapSize / (1024 * 1024));
          console.log(`Memory usage: ${usedMB}MB / ${totalMB}MB`);
        } else {
          // Alternative memory logging using heap snapshot info
          const memoryUsage = getMemoryUsage();
          console.log(`Memory usage (estimated): ${memoryUsage}`);
        }
      }, 2000); // Check every 2 seconds
    };

    // Helper function for platforms where performance.memory isn't available
    const getMemoryUsage = (): string => {
      if (global.gc) {
        // Force garbage collection if available
        global.gc();
      }

      return 'Memory API not available on this device';
    };

    // Start monitoring after initial render
    InteractionManager.runAfterInteractions(() => {
      startMemoryMonitoring();
    });

    return () => {
      // Clean up interval on component unmount
      if (memoryMonitoringInterval) {
        clearInterval(memoryMonitoringInterval);
      }
    };
  }, []);

  // Add this function to handle memory reset
  const resetVideoMemory = React.useCallback(() => {
  console.log('[Memory] Performing gentle reset of video components');

  // Only unregister videos that aren't currently visible or adjacent
  videos.forEach((video, index) => {
    if (
      video &&
      video.url &&
      index !== visibleVideoIndex &&
      index !== visibleVideoIndex + 1 &&
      index !== visibleVideoIndex - 1
    ) {
      VideoManager.unregisterVideo(video.url);
    }
  });

  // Don't change the FlatList key - that's causing scroll issues
  // Instead, just update a counter for tracking
  setResetKey(prevKey => prevKey + 1);

  // Reset swipe counter
  setSwipeCount(0);
}, [videos, visibleVideoIndex]);

  // Keep track of when the app started for deep cleanup
  const startTimeRef = React.useRef(Date.now());

  // Set up a regular cleanup timer
  React.useEffect(() => {
    // Clean up videos every 30 seconds regardless of user action
    const cleanupInterval = setInterval(() => {
      console.log('[Memory] Performing scheduled cleanup');

      // Force cleanup all videos except current one
      videos.forEach((video, index) => {
        if (index !== visibleVideoIndex && video && video.url) {
          VideoManager.unregisterVideo(video.url);
        }
      });

      // If we've been running a while, do a complete reset
      if (Date.now() - startTimeRef.current > 10 * 60 * 1000) { // 10 minutes
        console.log('[Memory] Performing deep cleanup after extended runtime');
        resetVideoMemory();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(cleanupInterval);
  }, [videos, visibleVideoIndex, resetVideoMemory]);

  return (
    <>
      <FlatList
          // Remove the key prop or make it less aggressive
          // key={`video-list-${resetKey}`}  // Comment this out for now
          key="video-list-fixed"  // Use a constant key instead of a changing one
          data={videos}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          pagingEnabled
          snapToInterval={Dimensions.get('window').height}
          snapToAlignment="start"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          testID="videoFlatList"
          ListFooterComponent={
            loading ? (
                <View
                    style={{
                      height: 100,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#0D0D0D',
                    }}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
            ) : null
          }
          windowSize={3}  // Increase to load more content off-screen
          maxToRenderPerBatch={2}  // Increase to render more items per batch
          initialNumToRender={2}  // Show more items initially
          removeClippedSubviewws={false}  // Disable this optimization temporarily
          updateCellsBatchingPeriod={50}
          onEndReached={() => {
            if (!loading && hasMore) {
              console.log('End reached, loading more videos');
              fetchVideos();
            }
          }}
          onEndReachedThreshold={0.5}
      />

      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        videoId={currentCommentVideoId}
        initialCommentCount={
          videos.find(v => v.id === currentCommentVideoId)?.comment_count || 0
        }
        onCommentCallback={handleCommentSubmit}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  videoPage: {
    height,
    backgroundColor: '#0D0D0D',
    justifyContent: 'space-between',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  videoContainer: {
    flex: 1,
  },
});
export default Homescreen;
