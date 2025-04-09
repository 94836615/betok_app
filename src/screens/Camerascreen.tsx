import React, {useCallback, useRef, useState, useEffect} from 'react';
import {StyleSheet, Text, TouchableOpacity, View, Alert, Platform} from 'react-native';
import {
  Camera,
  CameraCaptureError,
  useCameraDevices,
  VideoFile,
  CameraDevice,
  CameraPermissionStatus,
} from 'react-native-vision-camera';
import {
  NavigationProp,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {RootStackParamList} from './types.ts';

function CameraScreen() {
  const cameraRef = useRef<Camera>(null);
  const devices: CameraDevice[] = useCameraDevices();
  const device =
    devices.find(d => d.position === 'back') ??
    devices.find(d => d.position === 'front');
  const isFocused = useIsFocused();
  const [recordTimeoutId, setRecordTimeoutId] = useState<NodeJS.Timeout | null>(
    null,
  );
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  // Check for camera permissions
  useEffect(() => {
    async function checkPermissions() {
      try {
        setIsCheckingPermissions(true);
        let cameraPermission = await Camera.getCameraPermissionStatus();
        let microphonePermission = await Camera.getMicrophonePermissionStatus();
        
        // Request permissions if needed
        if (cameraPermission !== 'authorized') {
          cameraPermission = await Camera.requestCameraPermission();
        }
        if (microphonePermission !== 'authorized') {
          microphonePermission = await Camera.requestMicrophonePermission();
        }
        
        setHasPermission(
          cameraPermission === 'authorized' && microphonePermission === 'authorized'
        );
      } catch (error) {
        console.error('Error checking camera permissions:', error);
        Alert.alert('Permission Error', 'Could not verify camera permissions');
        setHasPermission(false);
      } finally {
        setIsCheckingPermissions(false);
      }
    }
    
    checkPermissions();
  }, []);

  // Cleanup function for camera resources
  useEffect(() => {
    return () => {
      if (recordTimeoutId) {
        clearTimeout(recordTimeoutId);
      }
      if (isRecording) {
        try {
          cameraRef.current?.stopRecording();
        } catch (e) {
          console.error('Error stopping recording during cleanup:', e);
        }
      }
    };
  }, [isRecording, recordTimeoutId]);

  const stopRecording = useCallback(async () => {
    try {
      if (!cameraRef.current || !isRecording) {
        return;
      }
      await cameraRef.current.stopRecording();

      if (recordTimeoutId) {
        clearTimeout(recordTimeoutId);
        setRecordTimeoutId(null);
      }
      setIsRecording(false);
    } catch (e) {
      console.error('Error stopping recording:', e);
      setIsRecording(false);
    }
  }, [recordTimeoutId, isRecording]);

  const startRecording = useCallback(async () => {
    try {
      if (!cameraRef.current || isRecording) {
        return;
      }
      setIsRecording(true);

      // Start recording
      cameraRef.current.startRecording({
        onRecordingFinished: async (video: VideoFile) => {
          console.log('Recording completed:', video.path);

          // Add a short delay to make sure the video file is fully written
          setTimeout(() => {
            navigation.navigate('PreviewScreen', {videoPath: video.path});
          }, 300);

          if (recordTimeoutId) {
            clearTimeout(recordTimeoutId);
            setRecordTimeoutId(null);
          }
          setIsRecording(false);
        },
        onRecordingError: (error: CameraCaptureError) => {
          console.error('Recording failed:', error);
          Alert.alert('Recording Error', 'Failed to record video');
          if (recordTimeoutId) {
            clearTimeout(recordTimeoutId);
            setRecordTimeoutId(null);
          }
          setIsRecording(false);
        },
      });

      const timeoutId = setTimeout(() => {
        console.log('Max record time (20s) reached, recording stopped...');
        stopRecording();
      }, 20000); // 20.000 ms = 20 sec

      setRecordTimeoutId(timeoutId);
    } catch (e) {
      console.error('Error starting recording:', e);
      setIsRecording(false);
      Alert.alert('Camera Error', 'Could not start recording');
    }
  }, [navigation, recordTimeoutId, stopRecording, isRecording]);

  if (isCheckingPermissions) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text>Camera permission is required</Text>
        <TouchableOpacity 
          style={styles.buttonRecord}
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text>No camera available</Text>
        <TouchableOpacity 
          style={styles.buttonRecord}
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused}
          video={true}
          audio={true}
          enableZoomGesture
        />
      )}

      <View style={styles.controlsContainer}>
        {!isRecording ? (
          <TouchableOpacity
            onPress={startRecording}
            style={styles.buttonRecord}>
            <Text style={styles.buttonText}>Record</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={stopRecording} style={styles.buttonStop}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default CameraScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  buttonRecord: {
    backgroundColor: 'red',
    borderRadius: 50,
    padding: 20,
    marginHorizontal: 20,
  },
  buttonStop: {
    backgroundColor: 'gray',
    borderRadius: 50,
    padding: 20,
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  videoPathContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  videoPathText: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
  },
});
