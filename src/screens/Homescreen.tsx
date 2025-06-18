import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
  ViewToken,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import ProfileHeader from '../components/ProfileHeader.tsx';
import VideoCard from '../components/VideoCard.tsx';
import VideoManager from '../utils/VideoManager.ts';
import { getDeviceId } from '../utils/user-utils.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {height} = Dimensions.get('window');

interface VideoItem {
  id: string;
  url: string;
  filename: string;
  caption?: string;
  created_at: string;
  user_id?: string;
  username?: string;
  like_count?: number;
}

const Homescreen = () => {
  // All state declarations first
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadedVideoIds, setLoadedVideoIds] = useState<Set<string>>(new Set());
  const [visibleVideoIndex, setVisibleVideoIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');

  // All refs second
  const currentIndexRef = useRef(0);
  const lastFetchTimeRef = useRef(0);
  const flatListRef = useRef<FlatList<VideoItem>>(null);

  // View configuration
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  const onViewableItemsChanged = useRef(({viewableItems}: {viewableItems: ViewToken[]}) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0;
      setVisibleVideoIndex(index);
      currentIndexRef.current = index;
    }
  }).current;

  // Functions
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const keyExtractor = useCallback((item: VideoItem) => item.id, []);

  const fetchVideos = useCallback(async () => {
    if (loading || !hasMore) return;

    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) return;
    lastFetchTimeRef.current = now;

    try {
      setLoading(true);

      // Get device ID for following feed
      const deviceId = await getDeviceId();

      // Build URL based on feed type
      let url = `http://127.0.0.1:8000/api/v1/videos?limit=2&offset=${offset}`;
      if (feedType === 'following') {
        url = `http://127.0.0.1:8000/api/v1/videos/following?user_id=${deviceId}&limit=2&offset=${offset}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setHasMore(false);
        return;
      }

      // Filter out already loaded videos
      const currentIds = new Set([...loadedVideoIds]);
      const newVideos = data.filter(video => !currentIds.has(video.id));

      if (newVideos.length === 0) {
        setHasMore(false);
        return;
      }

      // Add new video IDs to tracking
      newVideos.forEach(video => currentIds.add(video.id));
      setLoadedVideoIds(currentIds);

      // Update videos
      setVideos(prev => [...prev, ...newVideos]);
      setOffset(prev => prev + data.length);
    } catch (err) {
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, loadedVideoIds, feedType]);

  const handleLikeToggle = useCallback(async (videoId: string, isLiked: boolean): Promise<boolean> => {
    try {
      const deviceId = await getDeviceId();

      const url = `http://127.0.0.1:8000/api/v1/videos/${videoId}/like`;
      const method = isLiked ? 'POST' : 'DELETE';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceId),
      });

      if (!response.ok) {
        throw new Error(`Failed to update like: ${response.status}`);
      }

      const data = await response.json();

      // Store like state
      const storageKey = `video_like_${videoId}`;
      await AsyncStorage.setItem(storageKey, String(isLiked));

      return data.success || true;
    } catch (err) {
      console.error('Error toggling like:', err);
      return false;
    }
  }, []);

  const handleFollowToggle = useCallback(async (userId: string, shouldFollow: boolean): Promise<boolean> => {
    try {
      const deviceId = await getDeviceId();

      const url = `http://127.0.0.1:8000/api/v1/users/${userId}/follow`;
      const method = shouldFollow ? 'POST' : 'DELETE';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: deviceId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update follow status: ${response.status}`);
      }

      const data = await response.json();

      // Store follow state
      const storageKey = `user_follow_${userId}`;
      await AsyncStorage.setItem(storageKey, String(shouldFollow));

      // If we're in following feed and unfollowed a user, refresh
      if (feedType === 'following' && !shouldFollow) {
        resetFeed();
      }

      return data.success || true;
    } catch (err) {
      console.error('Error toggling follow:', err);
      return false;
    }
  }, [feedType]);

  const resetFeed = useCallback(() => {
    setVideos([]);
    setOffset(0);
    setLoadedVideoIds(new Set());
    setHasMore(true);

    // Wait a bit then fetch videos
    setTimeout(() => {
      fetchVideos();
    }, 100);
  }, [fetchVideos]);

  const renderItem = useCallback(({item, index}) => {
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
              userId={item.user_id}
              username={item.username || `User ${item.user_id?.substring(0, 8)}`}
              onToggleFollow={handleFollowToggle}
            />
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.headerOverlay}>
          <ProfileHeader
            feedType={feedType}
            onChangeFeedType={(type) => {
              setFeedType(type);
              resetFeed();
            }}
            onResetFeed={resetFeed}
          />
        </View>
      </View>
    );
  }, [
    visibleVideoIndex,
    isPaused,
    handleLikeToggle,
    handleFollowToggle,
    togglePause,
    feedType,
    resetFeed,
  ]);

  // Effects - always in the same order
  // Initial load
  useEffect(() => {
    fetchVideos();
  }, []);

  // Handle memory management
  useEffect(() => {
    // Cleanup function for videos
    const cleanupVideos = () => {
      videos.forEach((video, index) => {
        if (index !== visibleVideoIndex && video?.url) {
          VideoManager.unregisterVideo(video.url);
        }
      });
    };

    // Set up periodic cleanup
    const cleanupInterval = setInterval(() => {
      cleanupVideos();
    }, 30000);

    return () => clearInterval(cleanupInterval);
  }, [videos, visibleVideoIndex]);

  // Debug
  useEffect(() => {
    console.log(`Feed type: ${feedType}, Video count: ${videos.length}`);
  }, [feedType, videos.length]);

  return (
    <FlatList
      ref={flatListRef}
      data={videos}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      pagingEnabled
      snapToInterval={height}
      snapToAlignment="start"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.emptyText}>
            {feedType === 'following'
              ? 'Looking for videos from users you follow...'
              : 'Loading videos...'}
          </Text>
        </View>
      }
      ListFooterComponent={
        loading ? (
          <View style={styles.loadingFooter}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null
      }
      windowSize={3}
      maxToRenderPerBatch={2}
      initialNumToRender={2}
      removeClippedSubviews={false}
      updateCellsBatchingPeriod={50}
      onEndReached={() => {
        if (!loading && hasMore) {
          fetchVideos();
        }
      }}
      onEndReachedThreshold={0.5}
    />
  );
};

const styles = StyleSheet.create({
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
  loadingFooter: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
  },
  emptyContainer: {
    height,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#FFF',
    marginTop: 15,
    textAlign: 'center',
  },
});

export default Homescreen;
