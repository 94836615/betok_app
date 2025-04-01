import {StyleSheet, View, Text, Image} from 'react-native';
import React from 'react';

const ProfileHeader: React.FC = () => {
  return (
    <View style={styles.header}>
      <Image
        source={{uri: 'https://randomuser.me/api/portraits/men/48.jpg'}}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>Mitsuo</Text>
        <Text style={styles.timestamp}>20 min geleden</Text>
      </View>
    </View>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 30,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userInfo: {
    flexDirection: 'column',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  timestamp: {
    color: '#B0B0B0',
    fontSize: 14,
  },
});
