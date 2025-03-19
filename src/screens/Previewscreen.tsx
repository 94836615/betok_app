import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {useRoute, useNavigation, NavigationProp} from '@react-navigation/native';
import Video from 'react-native-video';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {RootStackParamList} from "./types.ts";

function PreviewScreen() {
    const route = useRoute();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const {videoPath} = route.params as { videoPath: string };

    const onClose = () => {
        navigation.goBack();
    };

    const onSave = async () => {
        try {
            await CameraRoll.saveAsset(videoPath, { type: 'video' });
            console.log('Video saved to gallery:', videoPath);
            navigation.navigate('CameraScreen');
        } catch (error) {
            console.error('Error saving video:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Video
                source={{uri: videoPath}}
                style={styles.video}
                resizeMode="contain"
                controls
            />

            <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.button} onPress={onClose}>
                    <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={onSave}>
                    <Text style={styles.buttonText}>Save to Gallery</Text>
                </TouchableOpacity>
            </View>
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
});
