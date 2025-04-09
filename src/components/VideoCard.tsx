import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import {registerVideoLoad, unregisterVideo} from '../utils/VideoManager';

const {height} = Dimensions.get('window');

interface VideoCardProps {
  url: string;
  isVisible?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({url, isVisible = false}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<React.RefObject<typeof Video>>(null);

  useEffect(() => {
    // Register video when component mounts
    const canLoad = registerVideoLoad(url);
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
      unregisterVideo(url);
      if (videoRef.current) {
        // Force unload video∏
        videoRef.current.seek(0);
      }
      console.log('Unloaded video:', url);
    };
  }, [url]);

  // When visibility changes
  useEffect(() => {
    if (!isVisible && videoRef.current) {
      // Pause and seek to start when not visible
      videoRef.current.seek(0);
    }
  }, [isVisible]);

  const onLoad = (data: any) => {
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

  const onError = (error: any) => {
    const errorDetail = {
      url: url,
      code: error.error?.code || 'unknown',
      message:
        error.error?.localizedDescription ||
        error.error?.message ||
        'Unknown error',
      domain: error.error?.domain || 'N/A',
    };
    console.error('Error loading video', errorDetail);
    setLoading(false);
    setError(errorDetail.message);

    // Simple retry mechanism (max 2 retries)
    if (retryCount < 2) {
      setTimeout(() => {
        console.info(`Retrying video load (${retryCount + 1}/2)`, {url: url});
        setRetryCount(prev => prev + 1);
        setLoading(true);
      }, 2000);
    } else {
      unregisterVideo(url); // Free up slot after failed retries
    }
  };

  return (
    <View style={styles.videoWrapper}>
      {!error && (
        <Video
          ref={videoRef}
          source={{uri: url}}
          style={styles.videoImage}
          resizeMode="cover"
          repeat
          paused={!isVisible}
          muted={!isVisible}
          onLoad={onLoad}
          onError={onError}
          controls={false}
          ignoreSilentSwitch="ignore"
          playInBackground={false}
          maxBitRate={1500000} // Lower bitrate to help with loading
          poster="https://via.placeholder.com/480x800/000000/FFFFFF?text=Loading..."
          onEnd={() => {
            if (videoRef.current) {videoRef.current.seek(0);}
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
          <Text style={styles.errorDetail}>{error}</Text>
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
