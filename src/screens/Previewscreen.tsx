import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  NavigationProp,
} from '@react-navigation/native';
import Video from 'react-native-video';
import {RootStackParamList} from './types.ts';

function PreviewScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {videoPath} = route.params as {videoPath: string};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const videoRef = useRef<React.ElementRef<typeof Video>>(null);

  useEffect(() => {
    // Validate video path
    if (!videoPath) {
      setError('Invalid video path');
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (videoRef.current) {
        videoRef.current.seek(0);
      }
    };
  }, [videoPath]);

  const onClose = () => {
    navigation.goBack();
  };

  const onVideoLoad = () => {
    setLoading(false);
    setError(null);
  };

  const onVideoError = (e: any) => {
    console.error('Video preview error:', e);
    setLoading(false);
    setError('Could not load video for preview');
  };

  const onSend = async () => {
    if (isSending) return;

    try {
      setIsSending(true);
      const originalName = videoPath.split('/').pop() || 'video.mp4';
      const fixedUri = videoPath.startsWith('file://')
        ? videoPath
        : `file://${videoPath}`;

      const formData = new FormData();
      formData.append('video', {
        uri: fixedUri,
        name: originalName,
        type: 'video/mp4',
      } as any);

      console.log('Sending video to server...');

      const response = await fetch('http://127.0.0.1:8000/api/v1/videos', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('SERVER RESPONSE STATUS:', response.status);
      const responseText = await response.text();
      console.log('RESPONSE TEXT:', responseText);

      if (response.ok) {
        console.info('Video sent successfully');
        navigation.navigate('CameraScreen');
      } else {
        console.error('Failed to send video:', response.status);
        Alert.alert('Error', `Unable to send video: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending video:', error);
      Alert.alert('Error', 'Failed to send video. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loaderText}>Loading preview...</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Video
            ref={videoRef}
            source={{uri: videoPath}}
            style={styles.video}
            resizeMode="contain"
            controls
            onLoad={onVideoLoad}
            onError={onVideoError}
            repeat={false}
            poster="https://via.placeholder.com/480x800/000000/FFFFFF?text=Loading..."
            posterResizeMode="cover"
          />

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isSending && styles.disabledButton]}
              onPress={onSend}
              disabled={isSending}>
              <Text style={styles.buttonText}>
                {isSending ? 'Sending...' : 'Send Video'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

export default PreviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    color: '#fff',
    fontSize: 20,
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  video: {
    flex: 1,
    width: '100%',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 30,
  },
  button: {
    backgroundColor: 'gray',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff5555',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#444',
    opacity: 0.7,
  },
});
