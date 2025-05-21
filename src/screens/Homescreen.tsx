import React from 'react';
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
import { getDeviceId, formatUUID } from '../utils/user-utils.ts';
// In Homescreen.tsx, add these imports
import { useLikedVideos, initGlobalLikedVideos } from '../hooks/useLikedVideos';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {height} = Dimensions.get('window');

interface VideoItem {
  id: string;
  url: string;
  filename: string;
  caption?: string;
  created_at: string;
}

const Homescreen: React.FC = () => {
  const [videos, setVideos] = React.useState<VideoItem[]>([]);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const currentIndexRef = React.useRef(0);
  const lastFetchTimeRef = React.useRef(0);
  const [loadedVideoIds, setLoadedVideoIds] = React.useState<Set<string>>(
      new Set(),
  );
  const [visibleVideoIndex, setVisibleVideoIndex] = React.useState<
      number | null
  >(null);
  const [isPaused, setIsPaused] = React.useState(false);

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

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 90,
  };

  const onViewableItemsChanged = React.useRef(
      ({viewableItems}: {viewableItems: ViewToken[]}) => {
        if (viewableItems.length > 0) {
          const index = viewableItems[0].index ?? 0;
          const previousIndex = visibleVideoIndex;

          // Force GC on previous video
          if (previousIndex !== null && previousIndex !== index) {
            console.log('[Memory] Forcing cleanup from', previousIndex, 'to', index);
            // Aggressively cleanup previous videos
            for (let i = 0; i < videos.length; i++) {
              if (i !== index && videos[i]) {
                VideoManager.unregisterVideo(videos[i].url);
              }
            }
          }

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
              onLikeToggle={handleLikeToggle}
            />
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.headerOverlay}>
          <ProfileHeader />
        </View>
      </View>
    );
  }, [handleLikeToggle, isPaused, visibleVideoIndex]);

  return (
      <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          pagingEnabled
          snapToInterval={Dimensions.get('window').height}
          snapToAlignment="start"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
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
          windowSize={2}
          maxToRenderPerBatch={1}
          initialNumToRender={1}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          onEndReached={() => {
            if (!loading && hasMore) {
              console.log('End reached, loading more videos');
              fetchVideos();
            }
          }}
          onEndReachedThreshold={0.5}
      />
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
