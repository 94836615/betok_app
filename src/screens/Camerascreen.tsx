import React, {useCallback, useRef, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {
  Camera,
  CameraCaptureError,
  useCameraDevices,
  VideoFile,
  CameraDevice,
} from 'react-native-vision-camera';
import {NavigationProp, useIsFocused, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from './types.ts';

function CameraScreen() {
  const cameraRef = useRef<Camera>(null);
  const devices: CameraDevice[] = useCameraDevices();
  // Zoek de back camera, of als fallback de front camera
  const device =
    devices.find(d => d.position === 'back') ??
    devices.find(d => d.position === 'front');
  const isFocused = useIsFocused();
  // const navigation = useNavigation();
  // 20 sec timeout storage
  const [recordTimeoutId, setRecordTimeoutId] = useState<NodeJS.Timeout | null>(
    null,
  );
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [isRecording, setIsRecording] = useState(false);
  // const [path, setPath] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      if (!cameraRef.current) {
        return;
      }
      setIsRecording(true);

      // Start recording
      cameraRef.current.startRecording({
        onRecordingFinished: async (video: VideoFile) => {
          console.log('Recording completed:', video.path);

          navigation.navigate('PreviewScreen', { videoPath: video.path });

          // await CameraRoll.saveAsset(`file://${path}`, {type: 'video'});

          if (recordTimeoutId) {
            clearTimeout(recordTimeoutId);
            setRecordTimeoutId(null);
          }
          setIsRecording(false);
        },
        onRecordingError: (error: CameraCaptureError) => {
          console.error('Recording failed:', error);
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
      console.error(e);
      setIsRecording(false);
    }
  }, [recordTimeoutId, navigation]);

  const stopRecording = useCallback(async () => {
    try {
      if (!cameraRef.current) {return;}
      await cameraRef.current.stopRecording();

      if (recordTimeoutId) {
        clearTimeout(recordTimeoutId);
        setRecordTimeoutId(null);
      }
      setIsRecording(false);
    } catch (e) {
      console.error(e);
    }
  }, [recordTimeoutId]);

  if (!device) {
    return (
      <View style={styles.center}>
        <Text>No camera available</Text>
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
          isActive={true}
          video={true}
          audio={true}
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

      {/*{path && (*/}
      {/*    <View style={styles.videoPathContainer}>*/}
      {/*        <Text style={styles.videoPathText}>Video opgeslagen op: {path}</Text>*/}
      {/*    </View>*/}
      {/*)}*/}
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

