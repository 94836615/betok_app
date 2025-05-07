import React, {useState, useEffect, useRef, useCallback} from 'react';
import {AppState} from 'react-native';
import {debounce} from 'lodash';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Video, {VideoRef} from 'react-native-video';
import VideoManager from '../utils/VideoManager';

const {height} = Dimensions.get('window');

interface VideoCardProps {
  url: string;
  isVisible?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({url, isVisible = false}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [appActive, setAppActive] = useState(true);
  const videoRef = useRef<VideoRef>(null);
  const isMounted = useRef(true);
  const shouldShowVideo = isVisible && appActive && !error;
  const previousVisible = useRef(isVisible);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRegisterVideoLoad = useCallback(
    debounce((videoUrl: string) => {
      if (isMounted.current) {
        VideoManager.registerVideoLoad(videoUrl);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    if (previousVisible.current && !isVisible) {
      if (videoRef.current) {
        videoRef.current.setNativeProps({muted: true});
        videoRef.current.seek(0);
      }
    }

    previousVisible.current = isVisible;
  }, [isVisible]);

  // Track app state changes to prevent problems when app is in background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      setAppActive(nextAppState === 'active');
    };
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, []);

  // Track component mounting state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      debouncedRegisterVideoLoad.cancel();
    };
  }, [debouncedRegisterVideoLoad]);

  useEffect(() => {
    // Register video when component mounts
    const canLoad = VideoManager.registerVideoLoad(url);
    if (!canLoad) {
      setError('Too many videos loaded simultaneously');
      setLoading(false);
    } else {
      // Reset states when URL changes
      setLoading(true);
      setError(null);
      setRetryCount(0);
      console.log('Loading video URL:', url);
    }

    // Cleanup function to unregister video when component unmounts
    return () => {
      try {
        if (isMounted.current) {
          VideoManager.unregisterVideo(url);
        }
        if (videoRef.current && isMounted.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          videoRef.current.seek(0);
        }
      } catch (err) {
        console.log('Cleanup error:', err);
      }
      console.log('Unloaded video:', url);
    };
  }, [url]);

  // When visibility changes
  useEffect(() => {
    if (isVisible) {
      debouncedRegisterVideoLoad(url);
    } else {
      try {
        if (videoRef.current && isMounted.current) {
          videoRef.current.seek(0);
        }
        VideoManager.unregisterVideo(url);
      } catch (err) {
        console.log('Error handling visibility change:', err);
      }
    }

    return () => {
      try {
        debouncedRegisterVideoLoad.cancel();
        if (isMounted.current) {
          VideoManager.unregisterVideo(url);
        }
      } catch (err) {
        console.log('Cleanup error in visibility effect:', err);
      }
    };
  }, [debouncedRegisterVideoLoad, isVisible, url]);

  const onLoad = (data: any) => {
    if (!isMounted.current) {
      return;
    }

    console.info('Video loaded successfully', {
      url: url,
      duration: data.duration,
      size: `${data.naturalSize?.width || 'unknown'}x${
        data.naturalSize?.height || 'unknown'
      }`,
    });
    setLoading(false);
    setError(null);
  };

  const onBuffer = (data: {isBuffering: boolean}) => {
    console.log(
      `Video buffer state: ${data.isBuffering ? 'buffering' : 'playing'}`,
      {url},
    );
  };

  const onError = (error: any) => {
    if (!isMounted.current) {
      return;
    }

    const errorDetail = {
      url: url,
      code: error.error?.code || 'unknown',
      message:
        error.error?.localizedDescription ||
        error.error?.message ||
        'Unknown error',
      domain: error.error?.domain || 'N/A',
      rawError: JSON.stringify(error),
    };
    console.error('Error loading video - full details:', errorDetail);
    setLoading(false);
    setError(errorDetail.message);

    // Simple retry mechanism (max 2 retries)
    if (retryCount < 2) {
      setTimeout(() => {
        if (isMounted.current) {
          console.info(`Retrying video load (${retryCount + 1}/2)`, {url: url});
          setRetryCount(prev => prev + 1);
          setLoading(true);
        }
      }, 2000 * (retryCount + 1)); // Exponential backoff
    } else {
      VideoManager.unregisterVideo(url); // Free up slot after failed retries
    }
  };

  // Configure source with appropriate type for MOV
  const getVideoSource = () => {
    if (url.toLowerCase().endsWith('.mov')) {
      return {
        uri: url,
        type: Platform.OS === 'ios' ? 'video/quicktime' : 'video/mp4',
        cache: true,
      };
    }
    return {uri: url};
  };

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.seek(0);
        // Force release of video resources
        // eslint-disable-next-line react-hooks/exhaustive-deps
        videoRef.current.setn({paused: true, muted: true});
      }
      // Ensure this video is unregistered when component unmounts
      VideoManager.unregisterVideo(url);
      console.log('Final cleanup for video:', url);
    };
  }, [url]);

  return (
    <View style={styles.videoWrapper}>
      {!error && shouldShowVideo && (
        <Video
          ref={videoRef}
          source={getVideoSource()}
          style={styles.videoImage}
          resizeMode="cover"
          repeat
          paused={!isVisible}
          muted={!isVisible}
          onLoad={onLoad}
          onError={onError}
          onBuffer={onBuffer}
          controls={false}
          ignoreSilentSwitch="ignore"
          playInBackground={false}
          maxBitRate={1500000}
          poster="https://via.placeholder.com/480x800/000000/FFFFFF?text=Loading..."
          progressUpdateInterval={500}
          onEnd={() => {
            if (videoRef.current && isMounted.current) {
              videoRef.current.seek(0);
            }
          }}
        />
      )}

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loaderText}>Loading video...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load video</Text>
          <Text style={styles.errorDetail}>
            {error.includes('Activity is null')
              ? 'App context error - please try again'
              : error}
          </Text>
          {retryCount >= 2 && (
            <Text style={styles.errorHint}>
              This might be due to an unsupported format or network issues
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default VideoCard;

const styles = StyleSheet.create({
  videoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  videoImage: {
    width: '100%',
    height: height,
    borderRadius: 0,
  },
  loaderContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 10,
  },
  loaderText: {
    color: '#FFFFFF',
    marginTop: 10,
  },
  errorContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    maxWidth: '80%',
  },
  errorText: {
    color: '#FF5555',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  errorDetail: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorHint: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
