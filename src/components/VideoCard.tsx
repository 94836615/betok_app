import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Video from 'react-native-video';

const {height} = Dimensions.get('window');

interface Props {
  url: string;
}

const VideoCard: React.FC<Props> = ({url}) => {
  return (
    <View style={styles.videoWrapper}>
      <Video
        source={{uri: url}}
        style={styles.videoImage}
        resizeMode="cover"
        repeat
        paused={false}
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
