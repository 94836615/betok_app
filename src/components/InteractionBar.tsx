import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useLike } from '../hooks/useLike';

const {height} = Dimensions.get('window');

interface InteractionBarProps {
  initialLikes?: number;
  initialLiked?: boolean;
  videoId?: string;
  videoUrl?: string;
  initialCommentCount?: number;
  onLikeToggle?: (videoId: string, isLiked: boolean) => Promise<boolean>;
  onCommentPress?: (videoId: string) => void;
  onSharePress?: (videoUrl: string) => void;
}

const InteractionBar: React.FC<InteractionBarProps> = ({
  initialLikes = 0,
  initialLiked = false,
  videoId = '',
  videoUrl = '',
  initialCommentCount = 0,
  onLikeToggle,
  onCommentPress,
  onSharePress,
}) => {
  // Use our custom hook for like functionality
  const {
    isLiked,
    formattedCount,
    isLoading,
    error,
    toggleLike,
    scaleAnim,
  } = useLike({
    initialLiked,
    initialCount: initialLikes,
    videoId,
    onLikeCallback: onLikeToggle,
  });

  // Format comment count for display
  const formattedCommentCount = initialCommentCount >= 1000
    ? (initialCommentCount / 1000).toFixed(1) + 'K'
    : initialCommentCount.toString();

  // Handle comment icon press
  const handleCommentPress = () => {
    if (onCommentPress && videoId) {
      onCommentPress(videoId);
    }
  };

  // Handle share icon press
  const handleSharePress = () => {
    if (onSharePress && videoUrl) {
      onSharePress(videoUrl);
    }
  };

  return (
    <View style={styles.interactions}>
      <TouchableOpacity testID="likeButton"
        style={styles.iconBtn}
        onPress={toggleLike}
        disabled={isLoading}
        accessibilityLabel={isLiked ? 'heart' : 'heart-outline'}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Icon
            name={isLiked ? 'heart' : 'heart-outline'}
            size={28}
            color={isLiked ? '#ff4d4d' : '#fff'}
          />
        </Animated.View>
        <Text style={styles.iconText}>{formattedCount}</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn} onPress={handleCommentPress} testID="commentButton">
        <Icon name="chatbubble-outline" size={28} color="#fff" />
        <Text style={styles.iconText} testID="commentCount">{formattedCommentCount}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn}>
        <Icon name="bookmark-outline" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn} onPress={handleSharePress} testID="shareButton">
        <Icon name="share-social-outline" size={28} color="#fff" />
        <Text style={styles.iconText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
};

export default InteractionBar;

const styles = StyleSheet.create({
  // Keep existing styles
  interactions: {
    position: 'absolute',
    right: 16,
    top: height * 0.35,
    alignItems: 'center',
  },
  iconBtn: {
    alignItems: 'center',
    marginBottom: 22,
    minHeight: 50, // Make room for error message
  },
  iconText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 10,
    marginTop: 2,
    position: 'absolute',
    bottom: -18,
    width: 80,
    textAlign: 'center',
  },
});
