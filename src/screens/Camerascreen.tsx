import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    Camera,
    CameraCaptureError,
    useCameraDevices,
    VideoFile,
    CameraDevice,
} from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';

function CameraScreen() {
    const cameraRef = useRef<Camera>(null);
    const devices: CameraDevice[] = useCameraDevices();
    // Zoek de back camera, of als fallback de front camera
    const device = devices.find(d => d.position === 'back') ?? devices.find(d => d.position === 'front');
    const isFocused = useIsFocused();

    const [isRecording, setIsRecording] = useState(false);
    const [videoPath, setVideoPath] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
        })();
    }, []);

    const startRecording = useCallback(async () => {
        try {
            if (!cameraRef.current) return;
            setIsRecording(true);
            cameraRef.current.startRecording({
              onRecordingFinished: (video: VideoFile) => {
                console.log('Opname voltooid:', video.path);
                setVideoPath(video.path);
                setIsRecording(false);
              },
              onRecordingError: (error: CameraCaptureError) => {
                console.error('Opname mislukt:', error);
                setIsRecording(false);
              },
            });
        } catch (e) {
            console.error(e);
            setIsRecording(false);
        }
    }, []);

    const stopRecording = useCallback(async () => {
        try {
            if (!cameraRef.current) {return;}
            await cameraRef.current.stopRecording();
            setIsRecording(false);
        } catch (e) {
            console.error(e);
        }
    }, []);

    if (!device) {
        return (
            <View style={styles.center}>
                <Text>Geen camera beschikbaar</Text>
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
                    <TouchableOpacity onPress={startRecording} style={styles.buttonRecord}>
                        <Text style={styles.buttonText}>Record</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={stopRecording} style={styles.buttonStop}>
                        <Text style={styles.buttonText}>Stop</Text>
                    </TouchableOpacity>
                )}
            </View>

            {videoPath && (
                <View style={styles.videoPathContainer}>
                    <Text style={styles.videoPathText}>Video opgeslagen op: {videoPath}</Text>
                </View>
            )}
        </View>
    );
}

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

export default CameraScreen;
