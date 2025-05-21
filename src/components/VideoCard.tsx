import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, Dimensions, ActivityIndicator, Text, Platform} from 'react-native';
import Video from 'react-native-video';

const {height} = Dimensions.get('window');

interface VideoCardProps {
  url: string;
  isVisible: boolean;
  id: string;
}

const VideoCard: React.FC<VideoCardProps> = ({url, isVisible, id}) => {
  const videoRef = useRef<any>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Sanitize the URL to ensure it's valid
  const sanitizedUrl = React.useMemo(() => {
    if (!url) return '';

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

  useEffect(() => {
    console.log(`VideoCard ${id} mounted with URL: ${sanitizedUrl}`);

    return () => {
      console.log(`VideoCard ${id} unmounting`);
      isMountedRef.current = false;

      if (videoRef.current) {
        try {
          videoRef.current.seek(0);
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

  // Return placeholder when not visible or URL is invalid
  if (!isVisible || !sanitizedUrl) {
    return <View style={styles.placeholder} />;
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{uri: sanitizedUrl}}
        style={styles.video}
        resizeMode="cover"
        repeat={true}
        paused={!isVisible}
        muted={!isVisible}
        playInBackground={false}
        onLoadStart={onLoadStart}
        onLoad={onLoad}
        onError={onError}
        onBuffer={onBuffer}
        // Better buffer settings
        progressUpdateInterval={1000}
        bufferConfig={{
          minBufferMs: 5000,
          maxBufferMs: 15000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000
        }}
        ignoreSilentSwitch="ignore"
        controls={false}
        preventsDisplaySleepDuringVideoPlayback={isVisible}
      />
      {(isBuffering || loadError) && (
        <View style={styles.overlay}>
          {isBuffering && !loadError ? (
            <>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.overlayText}>Loading video...</Text>
            </>
          ) : (
            <>
              <Text style={styles.errorText}>{loadError}</Text>
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
