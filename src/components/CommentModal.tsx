import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useComments } from '../hooks/useComments';

const { height, width } = Dimensions.get('window');

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  videoId: string;
  initialCommentCount?: number;
  onCommentCallback?: (videoId: string, comment: string) => Promise<boolean>;
}

interface CommentItemProps {
  id: string;
  text: string;
  created_at: string;
  username?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ text, created_at, username }) => {
  // Format the date to a readable format
  const formattedDate = new Date(created_at).toLocaleDateString();

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.username}>{username || 'Anonymous User'}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      <Text style={styles.commentText}>{text}</Text>
    </View>
  );
};

const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onClose,
  videoId,
  initialCommentCount = 0,
  onCommentCallback,
}) => {
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const [charactersLeft, setCharactersLeft] = useState(100);

  const {
    comments,
    commentCount,
    isLoading,
    error,
    addComment,
    fetchComments,
  } = useComments({
    videoId,
    initialCommentCount,
    onCommentCallback,
  });

  // Fetch comments when modal becomes visible
  useEffect(() => {
    if (visible) {
      fetchComments();

      // Focus the input when modal opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
  }, [visible, fetchComments]);

  // Update characters left counter
  useEffect(() => {
    setCharactersLeft(100 - commentText.length);
  }, [commentText]);

  const handleSubmit = async () => {
    if (commentText.trim() && commentText.length <= 100) {
      const success = await addComment(commentText);
      if (success) {
        setCommentText('');
        setCharactersLeft(100);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      testID="commentModal"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} testID="commentTitle">Comments ({commentCount})</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="closeButton">
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {isLoading && comments.length === 0 ? (
            <View style={styles.loadingContainer} testID="commentsLoading">
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : comments.length > 0 ? (
            <FlatList
              data={comments}
              renderItem={({ item }) => (
                <CommentItem
                  id={item.id}
                  text={item.text}
                  created_at={item.created_at}
                  username={item.username}
                />
              )}
              keyExtractor={(item) => item.id}
              style={styles.commentsList}
              showsVerticalScrollIndicator={false}
              testID="commentsList"
            />
          ) : (
            <View style={styles.emptyContainer} testID="emptyComments">
              <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
            </View>
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            {error && <Text style={styles.errorText} testID="commentError">{error}</Text>}
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                maxLength={100}
                multiline
                testID="commentInput"
              />
              <Text style={[
                styles.charCounter,
                charactersLeft < 10 ? styles.charCounterWarning : null
              ]}
              testID="charCounter">
                {charactersLeft}
              </Text>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!commentText.trim() || isLoading) ? styles.sendButtonDisabled : null
                ]}
                onPress={handleSubmit}
                disabled={!commentText.trim() || isLoading}
                testID="sendButton"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.7,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
  },
  date: {
    color: '#999',
    fontSize: 12,
  },
  commentText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  errorText: {
    color: '#ff4d4d',
    marginBottom: 8,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 8,
    maxHeight: 80,
  },
  charCounter: {
    color: '#999',
    fontSize: 12,
    marginRight: 8,
  },
  charCounterWarning: {
    color: '#ff4d4d',
  },
  sendButton: {
    backgroundColor: '#0095f6',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#0095f680',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CommentModal;
