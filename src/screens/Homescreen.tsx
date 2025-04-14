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
import InteractionBar from '../components/InteractionBar.tsx';
import VideoManager from '../utils/VideoManager.ts';

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

  onViewableItemsChanged = React.useRef(
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

  const renderItem = ({item, index}: {item: VideoItem; index: number}) => {
    const isVisible = index === visibleVideoIndex;
    return (
        <View style={styles.videoPage}>
          <TouchableWithoutFeedback onPress={togglePause}>
            <View style={styles.videoContainer}>
              <VideoCard url={item.url} isVisible={isVisible && !isPaused} />
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.headerOverlay}>
            <ProfileHeader />
          </View>
          <InteractionBar />
        </View>
    );
  };

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