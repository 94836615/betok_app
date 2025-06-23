// src/hooks/useComments.ts
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the comment interface
interface Comment {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  username?: string; // Optional username if available
}

interface UseCommentsOptions {
  videoId: string;
  initialCommentCount?: number;
  onCommentCallback?: (videoId: string, comment: string) => Promise<boolean>;
}

// Prefix for storage keys to avoid collisions
const COMMENT_COUNT_PREFIX = 'video_comment_count_';
const COMMENTS_PREFIX = 'video_comments_';

export const useComments = ({
  videoId,
  initialCommentCount = 0,
  onCommentCallback
}: UseCommentsOptions) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved comments and count on mount
  useEffect(() => {
    const loadComments = async () => {
      if (!videoId) return;

      try {
        // Load comment count
        const countKey = `${COMMENT_COUNT_PREFIX}${videoId}`;
        const savedCount = await AsyncStorage.getItem(countKey);

        // Load comments
        const commentsKey = `${COMMENTS_PREFIX}${videoId}`;
        const savedComments = await AsyncStorage.getItem(commentsKey);

        // Update state with stored values
        if (savedCount !== null) {
          setCommentCount(parseInt(savedCount, 10));
        } else if (initialCommentCount > 0) {
          // If no saved count but we have an initial count, use that
          setCommentCount(initialCommentCount);

          // And store it
          await AsyncStorage.setItem(countKey, initialCommentCount.toString());
        }

        if (savedComments !== null) {
          setComments(JSON.parse(savedComments));
        }
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    loadComments();
  }, [videoId, initialCommentCount]);

  // Save comments and count when they change
  useEffect(() => {
    const saveComments = async () => {
      if (!videoId || !isInitialized) return;

      try {
        // Save both the comments and count
        const countKey = `${COMMENT_COUNT_PREFIX}${videoId}`;
        const commentsKey = `${COMMENTS_PREFIX}${videoId}`;

        await AsyncStorage.setItem(countKey, String(commentCount));
        await AsyncStorage.setItem(commentsKey, JSON.stringify(comments));

        console.log(`Saved comments for ${videoId}, count: ${commentCount}`);
      } catch (err) {
        console.error('Error saving comments:', err);
      }
    };

    saveComments();
  }, [comments, commentCount, videoId, isInitialized]);

  // Format count for display (e.g., 3200 -> 3.2K)
  const formattedCount = useCallback((count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }, []);

  // Update count when initialCommentCount changes
  useEffect(() => {
    if (initialCommentCount > 0) {
      // Always update the count when initialCommentCount changes, even after initialization
      setCommentCount(initialCommentCount);

      // Also update AsyncStorage if initialized
      if (isInitialized && videoId) {
        const countKey = `${COMMENT_COUNT_PREFIX}${videoId}`;
        AsyncStorage.setItem(countKey, initialCommentCount.toString())
          .catch(err => console.error('Error updating comment count in storage:', err));
      }
    }
  }, [initialCommentCount, isInitialized, videoId]);

  // Add a new comment
  const addComment = useCallback(async (text: string) => {
    if (isLoading || !text.trim() || text.length > 100) {
      if (text.length > 100) {
        setError('Comment cannot exceed 100 characters');
        setTimeout(() => setError(null), 3000);
      }
      return false;
    }

    // Clear any previous errors
    setError(null);

    try {
      setIsLoading(true);

      // Create a temporary comment object
      const tempComment: Comment = {
        id: `temp-${Date.now()}`,
        text: text.trim(),
        created_at: new Date().toISOString(),
        user_id: 'current-user', // This would be replaced with actual user ID
      };

      // Update UI immediately for better UX (optimistic update)
      setComments(prev => [tempComment, ...prev]);
      setCommentCount(prev => prev + 1);

      // Call API if callback provided
      if (onCommentCallback && videoId) {
        const success = await onCommentCallback(videoId, text.trim());

        // If API call failed, revert UI changes
        if (!success) {
          setComments(prev => prev.filter(c => c.id !== tempComment.id));
          setCommentCount(prev => prev - 1);
          setError('Failed to post comment');

          // Auto-clear error after 3 seconds
          setTimeout(() => setError(null), 3000);
          return false;
        } else {
          // Store the updated count in AsyncStorage
          const countKey = `${COMMENT_COUNT_PREFIX}${videoId}`;
          await AsyncStorage.setItem(countKey, String(commentCount + 1));
          return true;
        }
      }

      return true;
    } catch (err) {
      // Revert changes on error
      setComments(prev => prev.filter(c => c.id !== `temp-${Date.now()}`));
      setCommentCount(prev => prev - 1);

      // Set error message
      console.error('Comment add error:', err);
      setError('Could not post comment');

      // Auto-clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, videoId, commentCount, onCommentCallback]);

  // Fetch comments from API
  const fetchComments = useCallback(async () => {
    if (!videoId) return;

    try {
      setIsLoading(true);

      // Fetch comments from the API
      const response = await fetch(`http://127.0.0.1:8000/api/v1/videos/${videoId}/comments`);

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      // The API returns an array of comments directly
      const commentsData = await response.json();

      // Fetch the comment count separately
      const countResponse = await fetch(`http://127.0.0.1:8000/api/v1/videos/${videoId}/comments/count`);

      if (!countResponse.ok) {
        throw new Error('Failed to fetch comment count');
      }

      const countData = await countResponse.json();
      const count = countData.count || 0;

      // Map the API response to our Comment interface
      const formattedComments = commentsData.map((comment: any) => ({
        id: comment.id,
        text: comment.content, // Map 'content' from API to 'text' in our interface
        created_at: comment.created_at,
        user_id: comment.user_id,
      }));

      // Update state with fetched comments
      setComments(formattedComments);
      setCommentCount(count);

      // Save to AsyncStorage
      const countKey = `${COMMENT_COUNT_PREFIX}${videoId}`;
      const commentsKey = `${COMMENTS_PREFIX}${videoId}`;

      await AsyncStorage.setItem(countKey, String(count));
      await AsyncStorage.setItem(commentsKey, JSON.stringify(formattedComments));

    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  return {
    comments,
    commentCount,
    formattedCount: formattedCount(commentCount),
    isLoading,
    error,
    addComment,
    fetchComments
  };
};
