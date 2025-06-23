import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CommentModal from '../src/components/CommentModal';
import { useComments } from '../src/hooks/useComments';

// Mock the useComments hook
jest.mock('../src/hooks/useComments', () => ({
  useComments: jest.fn()
}));

// Mock the Icon component
jest.mock('@react-native-vector-icons/ionicons', () => {
  const mockComponent = ({ name, size, color }) => {
    return <mock-icon name={name} size={size} color={color} testID={`icon-${name}`} />;
  };
  mockComponent.displayName = 'Icon';
  return mockComponent;
});

describe('CommentModal Component', () => {
  // Default props for the component
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    videoId: 'test-video-id',
    initialCommentCount: 5
  };

  // Default mock implementation for useComments
  const defaultUseCommentsMock = {
    comments: [
      { id: '1', text: 'Test comment 1', created_at: '2023-01-01T00:00:00Z', username: 'User1' },
      { id: '2', text: 'Test comment 2', created_at: '2023-01-02T00:00:00Z', username: 'User2' }
    ],
    commentCount: 2,
    isLoading: false,
    error: null,
    addComment: jest.fn().mockResolvedValue(true),
    fetchComments: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useComments as jest.Mock).mockReturnValue(defaultUseCommentsMock);
  });

  test('renders correctly when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <CommentModal {...defaultProps} />
    );

    // Check if the header is rendered with the correct comment count
    expect(getByText('Comments (2)')).toBeTruthy();

    // Check if comments are rendered
    expect(getByText('Test comment 1')).toBeTruthy();
    expect(getByText('Test comment 2')).toBeTruthy();

    // Check if the input is rendered
    expect(getByPlaceholderText('Add a comment...')).toBeTruthy();
  });

  test('does not render when not visible', () => {
    const { queryByText } = render(
      <CommentModal {...defaultProps} visible={false} />
    );

    // Modal should not be visible
    expect(queryByText('Comments (2)')).toBeNull();
  });

  test('displays loading state correctly', () => {
    (useComments as jest.Mock).mockReturnValue({
      ...defaultUseCommentsMock,
      isLoading: true,
      comments: []
    });

    const { getByText } = render(
      <CommentModal {...defaultProps} />
    );

    // Should show loading indicator
    expect(getByText('Loading comments...')).toBeTruthy();
  });

  test('displays empty state correctly', () => {
    (useComments as jest.Mock).mockReturnValue({
      ...defaultUseCommentsMock,
      comments: [],
      isLoading: false
    });

    const { getByText } = render(
      <CommentModal {...defaultProps} />
    );

    // Should show empty state message
    expect(getByText('No comments yet. Be the first to comment!')).toBeTruthy();
  });

  test('displays error message when there is an error', () => {
    (useComments as jest.Mock).mockReturnValue({
      ...defaultUseCommentsMock,
      error: 'Failed to load comments'
    });

    const { getByText } = render(
      <CommentModal {...defaultProps} />
    );

    // Should show error message
    expect(getByText('Failed to load comments')).toBeTruthy();
  });

  test('calls fetchComments when modal becomes visible', () => {
    render(<CommentModal {...defaultProps} />);

    // fetchComments should be called when the modal is visible
    expect(defaultUseCommentsMock.fetchComments).toHaveBeenCalled();
  });

  test('handles comment submission correctly', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <CommentModal {...defaultProps} />
    );

    // Type a comment
    const input = getByPlaceholderText('Add a comment...');
    fireEvent.changeText(input, 'New test comment');

    // Submit the comment
    const sendButton = getByTestId('icon-send');
    fireEvent.press(sendButton);

    // Check if addComment was called with the correct text
    await waitFor(() => {
      expect(defaultUseCommentsMock.addComment).toHaveBeenCalledWith('New test comment');
    });
  });

  test('does not submit empty comments', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <CommentModal {...defaultProps} />
    );

    // Type an empty comment (just spaces)
    const input = getByPlaceholderText('Add a comment...');
    fireEvent.changeText(input, '   ');

    // Try to submit
    const sendButton = getByTestId('icon-send');
    fireEvent.press(sendButton);

    // addComment should not be called
    expect(defaultUseCommentsMock.addComment).not.toHaveBeenCalled();
  });

  test('updates character counter correctly', () => {
    const { getByPlaceholderText, getByText } = render(
      <CommentModal {...defaultProps} />
    );

    // Initially should show 100 characters left
    expect(getByText('100')).toBeTruthy();

    // Type a 10-character comment
    const input = getByPlaceholderText('Add a comment...');
    fireEvent.changeText(input, '1234567890');

    // Should now show 90 characters left
    expect(getByText('90')).toBeTruthy();
  });

  test('calls onClose when close button is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByTestId } = render(
      <CommentModal {...defaultProps} onClose={onCloseMock} />
    );

    // Press the close button
    const closeButton = getByTestId('icon-close');
    fireEvent.press(closeButton);

    // onClose should be called
    expect(onCloseMock).toHaveBeenCalled();
  });
});
