import React from 'react';
import {View, StyleSheet} from 'react-native';
import ProfileHeader from '../components/ProfileHeader.tsx';
import VideoCard from '../components/VideoCard.tsx';
import InteractionBar from '../components/InteractionBar.tsx';

const Homescreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ProfileHeader />
      <VideoCard />
      <InteractionBar />
    </View>
  );
};

export default Homescreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderColor: '#2e2e2e',
    backgroundColor: '#0D0D0D',
  },
});
