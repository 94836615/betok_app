import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
  ViewToken,
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
  const [videos, setVideos] = React.useState<VideoItem[]>([]);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const currentIndexRef = React.useRef(0);
  const lastFetchedAtRef = React.useRef(0); // Track when we last fetched
  const [visibleVideoIndex, setVisibleVideoIndex] = React.useState<
    number | null
  >(null);

  const fetchVideos = React.useCallback(async () => {
    if (loading) {
      return;
    }

    try {
      lastFetchedAtRef.current = videos.length; // Update last fetched index
      setLoading(true);

      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/videos?limit=2&offset=${offset}`,
      );
      const data = await res.json();
      console.log('Fetched videos:', data);

      if (!Array.isArray(data) || data.length === 0) {
        console.warn('No more videos to load');
        setHasMore(false);
        return;
      }

      setVideos(prev => [...prev, ...data]);
      setOffset(prev => prev + data.length);
      lastFetchedAtRef.current = videos.length; // Store the last-fetched index
    } catch (err) {
      console.error('Error loading videos', err);
    } finally {
      setLoading(false);
    }
  }, [loading, offset, videos.length]);

  // Initial load
  React.useEffect(() => {
    fetchVideos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (
      currentIndexRef.current >= videos.length - 2 &&
      !loading &&
      hasMore &&
      lastFetchedAtRef.current !== videos.length
    ) {
      fetchVideos();
    }
  }, [videos.length, loading, hasMore, fetchVideos]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 90,
  };
  const onViewableItemsChanged = React.useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index ?? 0;
        console.log('Current visible index:', index);
        currentIndexRef.current = index;
        setVisibleVideoIndex(index);
        // slice video from the beginning
        if (index >= 3) {
          setVideos(prev => prev.slice(index));
        }
      } else {
        setVisibleVideoIndex(null);
      }
    },
  ).current;

  const renderItem = ({item, index}: {item: VideoItem; index: number}) => {
    console.log('Rendering video:', item.url);
    const isVisible = index === visibleVideoIndex;
    return (
      <View style={styles.videoPage}>
        <ProfileHeader />
        <VideoCard url={item.url} isVisible={isVisible} />
        <InteractionBar />
      </View>
    );
  };

  return (
    <FlatList
      data={videos}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      pagingEnabled
      snapToInterval={Dimensions.get('window').height}
      snapToAlignment="start"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={loading ? <ActivityIndicator color="#fff" /> : null}
      windowSize={3}
      maxToRenderPerBatch={2}
      initialNumToRender={2}
      removeClippedSubviews={true}
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
});

export default Homescreen;
