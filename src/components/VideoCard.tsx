import React from 'react';
import {View, StyleSheet, Image, Dimensions} from 'react-native';

const {height} = Dimensions.get('window');

const VideoCard = () => {
  return (
    <View style={styles.videoWrapper}>
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1584981512616-04d3f3f83b1a',
        }}
        style={styles.videoImage}
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
