import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// Add any other imports you need

interface ProfileHeaderProps {
  feedType: 'all' | 'following';
  onChangeFeedType: (type: 'all' | 'following') => void;
  onResetFeed: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  feedType,
  onChangeFeedType,
  onResetFeed
}) => {
  // Your existing ProfileHeader implementation

  return (
    <View style={styles.container}>
      {/* Your existing header content */}

      <View style={styles.feedToggleContainer}>
        <TouchableOpacity
          style={[
            styles.feedToggleButton,
            feedType === 'all' && styles.feedToggleButtonActive
          ]}
          onPress={() => {
            if (feedType !== 'all') {
              onChangeFeedType('all');
              onResetFeed();
            }
          }}
        >
          <Text style={[
            styles.feedToggleText,
            feedType === 'all' && styles.feedToggleTextActive
          ]}>
            For You
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.feedToggleButton,
            feedType === 'following' && styles.feedToggleButtonActive
          ]}
          onPress={() => {
            if (feedType !== 'following') {
              onChangeFeedType('following');
              onResetFeed();
            }
          }}
        >
          <Text style={[
            styles.feedToggleText,
            feedType === 'following' && styles.feedToggleTextActive
          ]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Your existing styles

  feedToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  feedToggleButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginHorizontal: 5,
  },
  feedToggleButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFF',
  },
  feedToggleText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedToggleTextActive: {
    color: '#FFF',
  },
});

export default ProfileHeader;
