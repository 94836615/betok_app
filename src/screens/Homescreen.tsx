import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import Icon from '@react-native-vector-icons/ionicons';
import ProfileHeader from '../components/ProfileHeader.tsx';

const {height} = Dimensions.get('window');

const Homescreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ProfileHeader />
      {/* Video */}
      <View style={styles.videoWrapper}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1524981512616-04d3f3f83b1a',
          }}
          style={styles.videoImage}
        />
      </View>
      {/* Interactions (right side) */}
      <View style={styles.interactions}>
        <TouchableOpacity style={styles.iconBtn}>
          <Icon name="heart-outline" size={28} color="#fff" />
          <Text style={styles.iconText}>3,2K</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn}>
          <Icon name="chatbubble-outline" size={28} color="#fff" />
          <Text style={styles.iconText}>1,2K</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="bookmark-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="share-social-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Homescreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
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
  interactions: {
    position: 'absolute',
    right: 16,
    top: height * 0.35,
    alignItems: 'center',
  },
  iconBtn: {
    alignItems: 'center',
    marginBottom: 22,
  },
  iconText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
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
