import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

const {height} = Dimensions.get('window');

const InteractionBar = () => {
  return (
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
        <Icon name="bookmark-outline" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn}>
        <Icon name="share-social-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default InteractionBar;

const styles = StyleSheet.create({
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
});
