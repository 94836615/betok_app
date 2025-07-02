import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import Video from 'react-native-video';
import InteractionBar from './InteractionBar';
import { getDeviceId } from '../utils/user-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGlobalLikedVideos } from '../hooks/useLikedVideos';

const { height } = Dimensions.get('window');

interface VideoCardProps {
  url: string;
  isVisible: boolean;
  isPaused?: boolean;
  id: string;
  likeCount?: number;
  commentCount?: number;
  onLikeToggle?: (videoId: string, isLiked: boolean) => Promise<boolean>;
  onCommentPress?: (videoId: string) => void;
  onSharePress?: (videoId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  url,
  isVisible,
  isPaused = false,
  id,
  likeCount = 0,
  commentCount = 0,
  onLikeToggle,
  onCommentPress,
  onSharePress,
}) => {
  const videoRef = useRef<any>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const [initialLiked, setInitialLiked] = useState(false);

  // Sanitize the URL to ensure it's valid
  const sanitizedUrl = React.useMemo(() => {
    if (!url) { return ''; }

    try {
      // Check if the URL is properly formatted
      if (url.includes('minio.noahnap.nlvideos')) {
        // Fix missing slash between domain and path
        return url.replace('minio.noahnap.nlvideos', 'minio.noahnap.nl/videos');
      }

      // Test if URL is valid by constructing a URL object
      new URL(url);
      return url;
    } catch (e) {
      console.error(`Invalid URL format: ${url}`, e);
      setLoadError(`Invalid URL format: ${url}`);
      return '';
    }
  }, [url]);

  // Load like status on mount
  useEffect(() => {
    const loadLikeStatus = async () => {
      if (!id) return;

      try {
        // First check AsyncStorage
        const storageKey = `video_like_${id}`;
        const savedLike = await AsyncStorage.getItem(storageKey);

        if (savedLike !== null) {
          setInitialLiked(savedLike === 'true');
        } else {
          // If no saved state, check from global store if available
          const globalStore = getGlobalLikedVideos();
          if (globalStore && globalStore.isVideoLiked) {
            setInitialLiked(globalStore.isVideoLiked(id));
          }
        }
      } catch (error) {
        console.error('Error loading like status:', error);
      }
    };

    loadLikeStatus();
  }, [id]);

  // Fetch like status from API when video becomes visible
  useEffect(() => {
    if (!id || typeof isVisible === 'undefined') return;

    // Only fetch when video becomes visible
    if (isVisible) {
      const fetchLikeStatus = async () => {
        try {
          const deviceId = await getDeviceId();

          const response = await fetch(
            `https://betok.noahnap.nl/api/v1/videos/${id}/like-status?user_id=${deviceId}`
          );

          if (response.ok) {
            const data = await response.json();
            setInitialLiked(data.is_liked);

            // Update AsyncStorage
            const storageKey = `video_like_${id}`;
            await AsyncStorage.setItem(storageKey, String(data.is_liked));

            // Update global liked videos store if available
            const globalStore = getGlobalLikedVideos();
            if (globalStore && globalStore.setVideoLiked) {
              globalStore.setVideoLiked(id, data.is_liked);
            }
          }
        } catch (error) {
          console.error('Error fetching like status:', error);
        }
      };

      fetchLikeStatus();
    }
  }, [id, isVisible]);

  // In VideoCard.tsx - completely revised video cleanup
  useEffect(() => {
    console.log(`VideoCard ${id} mounted with URL: ${sanitizedUrl}`);

    // On mount, ensure clean state
    if (videoRef.current) {
      videoRef.current.seek(0);
    }

    return () => {
      console.log(`VideoCard ${id} unmounting - aggressive cleanup`);
      isMountedRef.current = false;

      if (videoRef.current) {
        try {
          // Stop any playback immediately
          videoRef.current.setNativeProps({ paused: true });

          // Reset to beginning
          videoRef.current.seek(0);

          // Clear the source - critical for memory release
          videoRef.current.setNativeProps({ source: null });

          // Null out the ref
          setTimeout(() => {
            videoRef.current = null;
          }, 50);

          console.log(`[Memory] VideoCard ${id} resources forcibly released`);
        } catch (e) {
          console.error(`Error cleaning up video ${id}:`, e);
        }
      }
    };
  }, [id, sanitizedUrl]);

  const onLoadStart = () => {
    if (!isMountedRef.current) return;
    console.log(`Starting to load video: ${id}`);
    setIsBuffering(true);
    setLoadError(null);
  };

  const onLoad = (data: any) => {
    if (!isMountedRef.current) return;
    console.log(`Video loaded: ${id}, duration: ${data.duration}s`);
    setIsBuffering(false);
  };

  const onError = (error: any) => {
    if (!isMountedRef.current) return;

    // Extract detailed error information
    const errorMessage = error.error?.errorString || 'Video playback error';
    const errorDetails = error.error?.errorException || '';
    const errorStack = error.error?.errorStackTrace || '';

    console.error(`Error loading video - full details:`, error);

    // Check for specific network errors
    if (errorStack && errorStack.includes('UnknownHostException')) {
      setLoadError('Network error: Unable to connect to video server');
    } else if (errorStack && errorStack.includes('IOException')) {
      setLoadError('Network error: Problem downloading video');
    } else {
      setLoadError(`${errorMessage} ${errorDetails}`);
    }

    setIsBuffering(false);
  };

  const onBuffer = (buffer: any) => {
    if (!isMountedRef.current) return;
    setIsBuffering(buffer.isBuffering);
  };

  // Add to VideoCard.tsx, in the component
  useEffect(() => {
    if (likeCount > 0 && id) {
      // Update the stored count with the server value
      const countKey = `video_like_count_${id}`;
      AsyncStorage.setItem(countKey, String(likeCount))
        .catch(error => console.error('Error saving like count:', error));
    }
  }, [id, likeCount]);

  if (typeof isVisible === 'undefined' || !isVisible || !sanitizedUrl) {
    return <View style={styles.placeholder} />;
  }

  return (
    <View style={styles.container} testID="videoCard" accessibilityLabel={id}>
      <Video
        ref={videoRef}
        source={{uri: sanitizedUrl}}  // Always provide the URI
        style={styles.video}
        resizeMode="cover"
        repeat={true}
        paused={isPaused || !isVisible}  // Use isPaused prop for pausing
        // Other props remain the same
        muted={!isVisible}
        playInBackground={false}
        onLoadStart={onLoadStart}
        onLoad={onLoad}
        onError={onError}
        onBuffer={onBuffer}
        // Better buffer settings - smaller buffers
        progressUpdateInterval={1000}
        bufferConfig={{
          minBufferMs: 2000,           // Reduced buffer size
          maxBufferMs: 5000,           // Reduced max buffer
          bufferForPlaybackMs: 1000,   // Smaller playback buffer
          bufferForPlaybackAfterRebufferMs: 2000,
        }}
        // Critical for memory management
        onEnd={() => {
          if (videoRef.current) {
            videoRef.current.seek(0);  // Reset position on end
          }
        }}
        ignoreSilentSwitch="ignore"
        controls={false}
        preventsDisplaySleepDuringVideoPlayback={isVisible}
        testID="videoPlayer"
      />

      <InteractionBar
        videoId={id}
        videoUrl={sanitizedUrl}
        initialLikes={likeCount}
        initialLiked={initialLiked}
        initialCommentCount={commentCount}
        onLikeToggle={onLikeToggle}
        onCommentPress={onCommentPress}
        onSharePress={onSharePress}
      />

      {(isBuffering || loadError) && (
        <View style={styles.overlay} testID="videoOverlay">
          {isBuffering && !loadError ? (
            <>
              <ActivityIndicator size="large" color="#FFFFFF" testID="loadingIndicator" />
              <Text style={styles.overlayText}>Loading video...</Text>
            </>
          ) : (
            <>
              <Text style={styles.errorText} testID="errorText">{loadError}</Text>
              <Text style={styles.errorSubtext}>
                Please check your network connection
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  overlayText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#ff5555',
    textAlign: 'center',
    padding: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorSubtext: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#111',
  },
});

export default VideoCard;
