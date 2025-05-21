import React, {useCallback, useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
  ViewToken,
  TouchableWithoutFeedback,
  Text,
  SafeAreaView,
  Platform,
} from 'react-native';
import ProfileHeader from '../components/ProfileHeader.tsx';
import VideoCard from '../components/VideoCard.tsx';
import InteractionBar from '../components/InteractionBar.tsx';

const {height} = Dimensions.get('window');

interface VideoItem {
  id: string;
  url: string;
  filename: string;
  caption?: string;
  created_at: string;
}

const Homescreen: React.FC = () => {
  const [videoMetadata, setVideoMetadata] = useState<VideoItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Add this flag to track when we've reached the end of available videos
  const [reachedEndOfList, setReachedEndOfList] = useState(false);

  // Track scroll direction to handle up vs down scrolling differently
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const previousIndexRef = useRef(0);

  // Limit total videos to prevent memory issues
  const MAX_VIDEOS = 10;

  const flatListRef = useRef<FlatList>(null);
  const currentOffsetRef = useRef(0);
  const lastCleanupRef = useRef(Date.now());

  // Track loaded video IDs to prevent duplicates
  const loadedVideoIds = useRef(new Set<string>());

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Initial data load
  useEffect(() => {
    const loadInitialVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:8000/api/v1/videos?limit=2&offset=0');

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }

        console.log(`Loaded ${data.length} initial videos`);

        // Track loaded IDs
        data.forEach(item => loadedVideoIds.current.add(item.id));

        setVideoMetadata(data);
        currentOffsetRef.current = data.length;

        // Check if we might have reached the end already
        if (data.length < 2) {
          console.log('Initial data suggests we may have reached the end of the list');
          setReachedEndOfList(true);
        }
      } catch (err) {
        console.error('Failed to load initial videos:', err);
        setError('Failed to load videos. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialVideos();
  }, []);

  // Track direction of scrolling
  useEffect(() => {
    if (previousIndexRef.current < activeIndex) {
      setScrollDirection('down');
    } else if (previousIndexRef.current > activeIndex) {
      setScrollDirection('up');
    }

    previousIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Memory cleanup
  useEffect(() => {
    const memoryCleanupInterval = setInterval(() => {
      if (Date.now() - lastCleanupRef.current >= 20000) {
        console.log('Running memory cleanup');

        // Specifically clear far-away videos from memory
        if (videoMetadata.length > 5) {
          // Keep only videos within reasonable range of current position
          const newMetadata = videoMetadata.filter((_, index) =>
            Math.abs(index - activeIndex) <= 3
          );

          if (newMetadata.length < videoMetadata.length) {
            console.log(`Pruning ${videoMetadata.length - newMetadata.length} videos far from current position`);
            setVideoMetadata(newMetadata);
          }
        }

        lastCleanupRef.current = Date.now();
      }
    }, 5000);

    return () => clearInterval(memoryCleanupInterval);
  }, [videoMetadata, activeIndex]);

  // Load more videos when scrolling down
  const loadMoreVideos = useCallback(async () => {
    // Don't load more if:
    // 1. We're already loading
    // 2. We're at max capacity
    // 3. We've reached the end of available videos
    if (loadingMore || videoMetadata.length >= MAX_VIDEOS || reachedEndOfList) {
      if (videoMetadata.length >= MAX_VIDEOS) {
        console.log(`Hit maximum video limit (${MAX_VIDEOS}), not loading more`);
      }
      if (reachedEndOfList) {
        console.log('Already reached end of list, not loading more');
      }
      return;
    }

    try {
      setLoadingMore(true);
      const offset = currentOffsetRef.current;

      console.log(`Loading more videos from offset ${offset}`);
      const response = await fetch(`http://127.0.0.1:8000/api/v1/videos?limit=2&offset=${offset}`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // If we got no videos or empty array, we've reached the end
      if (!Array.isArray(data) || data.length === 0) {
        console.log('No more videos available, reached end of list');
        setReachedEndOfList(true);
        return;
      }

      // Filter out duplicates
      const newVideos = data.filter(video => !loadedVideoIds.current.has(video.id));

      // If after filtering we have no new videos, we've effectively reached the end
      if (newVideos.length === 0) {
        console.log('All returned videos already loaded, reached end of list');
        setReachedEndOfList(true);
        return;
      }

      // Track new video IDs
      newVideos.forEach(item => loadedVideoIds.current.add(item.id));

      console.log(`Adding ${newVideos.length} new videos`);

      // If adding these would exceed limit, only take what we can fit
      const videosToAdd = newVideos.slice(0, MAX_VIDEOS - videoMetadata.length);

      setVideoMetadata(prev => [...prev, ...videosToAdd]);
      currentOffsetRef.current += videosToAdd.length;

      // If we got fewer videos than requested, we've reached the end
      if (data.length < 2) {
        console.log('Received fewer videos than requested, reached end of list');
        setReachedEndOfList(true);
      }
    } catch (err) {
      console.error('Failed to load more videos:', err);
      // On error, assume we might have reached the end to prevent spam
      setReachedEndOfList(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, videoMetadata.length, reachedEndOfList]);

  // Load more when near the end of the list when scrolling DOWN
  useEffect(() => {
    if (
      scrollDirection === 'down' &&
      activeIndex >= videoMetadata.length - 2 &&
      videoMetadata.length > 0 &&
      !reachedEndOfList  // Only try to load more if we haven't reached the end
    ) {
      loadMoreVideos();
    }
  }, [activeIndex, videoMetadata.length, loadMoreVideos, scrollDirection, reachedEndOfList]);

  // Handle viewability changes
  const onViewableItemsChanged = useCallback(({viewableItems}: {viewableItems: ViewToken[]}) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const newIndex = viewableItems[0].index;
      // Avoid unnecessary updates
      if (newIndex !== activeIndex) {
        console.log(`Video at index ${newIndex} is now visible`);
        setActiveIndex(newIndex);
      }
    }
  }, [activeIndex]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Only render the active video to save memory
  const shouldRenderVideo = useCallback((index: number) => {
    return index === activeIndex;
  }, [activeIndex]);

  // Render a video item
  const renderItem = useCallback(({item, index}: {item: VideoItem; index: number}) => {
    const isActive = index === activeIndex;
    const shouldRender = shouldRenderVideo(index);

    return (
      <View style={styles.videoPage}>
        <TouchableWithoutFeedback onPress={togglePause}>
          <View style={styles.videoContainer}>
            {shouldRender ? (
              <VideoCard
                key={`video-${item.id}`}
                url={item.url}
                isVisible={isActive && !isPaused}
                id={item.id}
              />
            ) : (
              <View style={styles.placeholder} />
            )}
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.headerOverlay}>
          <ProfileHeader />
        </View>
        <View style={styles.interactionContainer}>
          <InteractionBar />
        </View>
      </View>
    );
  }, [activeIndex, isPaused, shouldRenderVideo]);

  // Generate keys for list items
  const keyExtractor = useCallback((item: VideoItem) => item.id, []);

  // Reset function for retry button
  const resetAndRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    loadedVideoIds.current.clear(); // Reset loaded IDs
    setReachedEndOfList(false); // Reset end of list flag

    fetch('http://127.0.0.1:8000/api/v1/videos?limit=2&offset=0')
      .then(res => res.json())
      .then(data => {
        data.forEach((item: VideoItem) => loadedVideoIds.current.add(item.id));
        setVideoMetadata(data);
        currentOffsetRef.current = data.length;
        setLoading(false);

        // Check if we might have reached the end already
        if (data.length < 2) {
          setReachedEndOfList(true);
        }
      })
      .catch(err => {
        console.error('Retry failed:', err);
        setError('Failed to load videos. Please try again.');
        setLoading(false);
      });
  }, []);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableWithoutFeedback onPress={resetAndRetry}>
          <View style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    );
  }

  // Empty state
  if (videoMetadata.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>No videos available</Text>
      </SafeAreaView>
    );
  }

  // Normal rendering with videos
  return (
    <FlatList
      ref={flatListRef}
      data={videoMetadata}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      pagingEnabled
      snapToInterval={height}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      // Disable momentum to prevent scrolling too far
      disableIntervalMomentum={true}
      ListFooterComponent={
        // Show footer only if we're loading or have reached the end
        loadingMore ? (
          <View style={[styles.loadingFooter, styles.centerContent]}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : reachedEndOfList ? (
          <View style={[styles.loadingFooter, styles.centerContent]}>
            <Text style={styles.endOfListText}>End of videos</Text>
          </View>
        ) : null
      }
      maxToRenderPerBatch={1}
      windowSize={2}
      initialNumToRender={1}
      updateCellsBatchingPeriod={150}
      getItemLayout={(data, index) => ({
        length: height,
        offset: height * index,
        index,
      })}
      // This is important for memory management
      removeClippedSubviews={true}
      extraData={[activeIndex, isPaused, reachedEndOfList]}
      // For iOS, make sure scrolling is smooth
      scrollEventThrottle={16}
      // Safe scroll mode to prevent scroll bugs
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 1
      }}
      // Prevent excessive scrolling
      onEndReachedThreshold={0.1}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    margin: 20,
    textAlign: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  endOfListText: {
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  videoPage: {
    height,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoContainer: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#111',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  interactionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  loadingFooter: {
    height: 50,
  },
});

export default Homescreen;
