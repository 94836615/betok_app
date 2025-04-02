import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
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

  const fetchVideos = React.useCallback(async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
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
    } catch (err) {
      console.error('Error loading videos', err);
    } finally {
      setLoading(false);
    }
  }, [loading, offset]);

  React.useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const renderItem = ({item}: {item: VideoItem}) => {
    console.log('Rendering video:', item.url); // ✅ zie je deze?
    return (
      <View style={styles.videoPage}>
        <ProfileHeader />
        <VideoCard url={item.url} />
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
      onEndReached={hasMore ? fetchVideos : null}
      onEndReachedThreshold={0.9}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={loading ? <ActivityIndicator color="#fff" /> : null}
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
