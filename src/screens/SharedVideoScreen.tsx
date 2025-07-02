import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import VideoCard from '../components/VideoCard';
import Icon from '@react-native-vector-icons/ionicons';

interface SharedVideoScreenProps {
  route: {
    params: {
      videoId: string;
    };
  };
  navigation: any;
}

interface VideoDetails {
  id: string;
  url: string;
  like_count: number;
  comment_count: number;
  filename: string;
  created_at: string;
}

const SharedVideoScreen: React.FC<SharedVideoScreenProps> = ({ route, navigation }) => {
  const { videoId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);

  useEffect(() => {
    fetchVideoDetails();
  }, [videoId]);

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the video details from the API
      const response = await fetch(`https://betok.noahnap.nl/api/v1/videos/${videoId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status}`);
      }

      const data = await response.json();
      setVideoDetails(data);
    } catch (err) {
      console.error('Error fetching video details:', err);
      setError('Could not load the video. It may have been removed or is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shared Video</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color="#ff4d4d" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchVideoDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : videoDetails ? (
        <View style={styles.videoContainer}>
          <VideoCard
            url={videoDetails.url}
            isVisible={true}
            id={videoDetails.id}
            likeCount={videoDetails.like_count}
            commentCount={videoDetails.comment_count}
          />
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No video found</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4d4d',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0095f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
  },
});

export default SharedVideoScreen;
