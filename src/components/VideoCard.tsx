import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, Dimensions, ActivityIndicator, Text} from 'react-native';
import Video from 'react-native-video';

const {height} = Dimensions.get('window');

// Global set with a maximum size
const MAX_CACHE_SIZE = 3;
const cachedVideoIds = new Set<string>();

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
  const [videoReady, setVideoReady] = useState(false);

  // Add component mount/unmount logging
  useEffect(() => {
    console.log(`VideoCard ${id} mounted`);

    return () => {
      console.log(`VideoCard ${id} unmounting`);
      isMountedRef.current = false;

      // Ensure video is properly released
      if (videoRef.current) {
        try {
          // Stop playback and reset position
          videoRef.current.seek(0);

          // Additional cleanup
          if (typeof videoRef.current.unload === 'function') {
            videoRef.current.unload();
          }
        } catch (e) {
          console.error(`Error cleaning up video ${id}:`, e);
        }
      }
    };
  }, [id]);

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      console.log(`Video ${id} is now visible`);

      // Manage cache size
      if (!cachedVideoIds.has(id)) {
        // If cache is full, remove one item
        if (cachedVideoIds.size >= MAX_CACHE_SIZE) {
          const firstItem = cachedVideoIds.values().next().value;
          console.log(`Cache full, removing ${firstItem}`);
          cachedVideoIds.delete(firstItem);
        }

        // Add current video to cache
        cachedVideoIds.add(id);
        console.log(`Added ${id} to cache. Cache size: ${cachedVideoIds.size}`);
      }

      // Reset playback when becoming visible
      if (videoRef.current && videoReady) {
        try {
          videoRef.current.seek(0);
        } catch (e) {
          console.error(`Error seeking video ${id}:`, e);
        }
      }
    } else {
      console.log(`Video ${id} is now hidden`);

      // When hidden, immediately pause and reset
      if (videoRef.current) {
        try {
          videoRef.current.seek(0);
        } catch (e) {
          // Ignore errors when releasing resources
        }
      }
    }
  }, [isVisible, id, videoReady]);

  const onLoadStart = () => {
    if (!isMountedRef.current) return;
    console.log(`Starting to load video: ${id}`);
    setIsBuffering(true);
    setLoadError(null);
    setVideoReady(false);
  };

  const onLoad = (data: any) => {
    if (!isMountedRef.current) return;

    console.log(`Video loaded: ${id}, duration: ${data.duration}s`);
    setIsBuffering(false);
    setVideoReady(true);

    // Start from beginning if visible
    if (isVisible && videoRef.current) {
      try {
        videoRef.current.seek(0);
      } catch (e) {
        console.error(`Error seeking video ${id} after load:`, e);
      }
    }
  };

  const onError = (error: any) => {
    if (!isMountedRef.current) return;

    const errorMessage = error.error?.localizedDescription || 'Video playback error';
    console.error(`Error playing video ${id}:`, errorMessage);
    setLoadError(errorMessage);
    setIsBuffering(false);
  };

  const onBuffer = (buffer: any) => {
    if (!isMountedRef.current) return;
    setIsBuffering(buffer.isBuffering);
  };

  const onEnd = () => {
    if (!isMountedRef.current || !isVisible) return;

    console.log(`Video ${id} reached end, looping`);
    if (videoRef.current) {
      try {
        videoRef.current.seek(0);
      } catch (e) {
        console.error(`Error seeking to beginning after end for ${id}:`, e);
      }
    }
  };

  // Render loading overlay
  const renderOverlay = () => {
    if (!isVisible) return null;

    if (isBuffering) {
      return (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>
            {cachedVideoIds.has(id) ? 'Starting playback...' : 'Loading video...'}
          </Text>
        </View>
      );
    } else if (loadError) {
      return (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      );
    }
    return null;
  };

  // Return placeholder when not visible
  if (!isVisible) {
    return <View style={styles.placeholder} />;
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{uri: url}}
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
        onEnd={onEnd}
        // Minimal buffer settings
        progressUpdateInterval={1000} // Less frequent updates
        bufferConfig={{
          minBufferMs: 5000,           // 5 second buffer minimum
          maxBufferMs: 15000,          // 15 second maximum buffer
          bufferForPlaybackMs: 2500,   // Start playback after 2.5s
          bufferForPlaybackAfterRebufferMs: 5000 // After rebuffer, wait 5s
        }}
        ignoreSilentSwitch="ignore"
        controls={false}
        preventsDisplaySleepDuringVideoPlayback={isVisible}
      />
      {renderOverlay()}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    padding: 15,
    fontSize: 16,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#111',
  },
});

export default VideoCard;
