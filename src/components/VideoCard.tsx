import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Video from 'react-native-video';

const {height} = Dimensions.get('window');

interface VideoCardProps {
  url: string;
  isVisible?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({url, isVisible = false}) => {
  const onLoad = (data: any) => {
    console.info('Video loaded successfully', data);
  };

  const onError = (error: any) => {
    console.error('Error loading video', error);
  };

  const onBuffer = (buffer: any) => {
    console.info('Video buffering', buffer);
  };
  return (
    <View style={styles.videoWrapper}>
      <Video
        source={{uri: url}}
        style={styles.videoImage}
        resizeMode="cover"
        repeat
        paused={!isVisible}
        muted={!isVisible}
        onLoad={onLoad}
        onError={onError}
        onBuffer={onBuffer}
      />
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
    height: height * 0.6,
    borderRadius: 12,
  },
});
