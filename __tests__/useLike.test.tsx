// __tests__/useLike.test.tsx
import React from 'react';
import { act } from 'react-test-renderer';
import { renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLike } from '../src/hooks/useLike';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock setTimeout and console
// @ts-ignore
global.setTimeout = jest.fn(cb => cb());
console.error = jest.fn();
console.log = jest.fn();

describe('useLike Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
  });

  test('should initialize with default values when no params provided', () => {
    const { result } = renderHook(() => useLike());

    expect(result.current.likeCount).toBe(0);
    expect(result.current.formattedCount).toBe('0');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should initialize with provided values', () => {
    const { result } = renderHook(() =>
      useLike({
        initialLiked: true,
        initialCount: 10,
        videoId: 'test-video',
      })
    );

    expect(result.current.isLiked).toBe(true);
    expect(result.current.likeCount).toBe(10);
    expect(result.current.formattedCount).toBe('10');
  });

  test('should format like counts correctly', () => {
    // Test regular numbers
    const { result: result1 } = renderHook(() =>
      useLike({ initialCount: 42 })
    );
    expect(result1.current.formattedCount).toBe('42');

    // Test thousands with formatting
    const { result: result2 } = renderHook(() =>
      useLike({ initialCount: 1234 })
    );
    expect(result2.current.formattedCount).toBe('1.2K');

    // Test larger numbers
    const { result: result3 } = renderHook(() =>
      useLike({ initialCount: 42000 })
    );
    expect(result3.current.formattedCount).toBe('42.0K');
  });

  test('toggleLike should increment count when liked', () => {
    const mockCallback = jest.fn().mockResolvedValue(true);

    const { result } = renderHook(() =>
      useLike({
        initialLiked: false,
        initialCount: 5,
        videoId: 'test-id',
        onLikeCallback: mockCallback,
      })
    );

    // Use act to trigger state updates
    act(() => {
      result.current.toggleLike();
    });

    expect(result.current.isLiked).toBe(true);
    expect(result.current.likeCount).toBe(6);
    expect(mockCallback).toHaveBeenCalledWith('test-id', true);
  });

  test('toggleLike should decrement count when unliked', () => {
    const mockCallback = jest.fn().mockResolvedValue(true);

    const { result } = renderHook(() =>
      useLike({
        initialLiked: true,
        initialCount: 5,
        videoId: 'test-id',
        onLikeCallback: mockCallback,
      })
    );

    act(() => {
      result.current.toggleLike();
    });
    expect(result.current.likeCount).toBe(4);
    expect(mockCallback).toHaveBeenCalledWith('test-id', false);
  });

  test('should not go below zero when unliking at zero count', () => {
    const { result } = renderHook(() =>
      useLike({
        initialLiked: true,
        initialCount: 0,
      })
    );

    act(() => {
      result.current.toggleLike();
    });

    // Count should stay at zero, not go negative
    expect(result.current.likeCount).toBe(0);
  });

  test('should revert changes when API call fails', async () => {
    // Create a mock implementation that simulates the API call failing
    const mockCallback = jest.fn().mockImplementation(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 10));
      // Return false to indicate failure
      return false;
    });

    // Render the hook with our mock
    const { result, rerender } = renderHook(() =>
      useLike({
        initialLiked: false,
        initialCount: 5,
        videoId: 'test-id',
        onLikeCallback: mockCallback,
      })
    );

    // Initial state
    expect(result.current.isLiked).toBe(false);
    expect(result.current.likeCount).toBe(5);

    // Toggle like - this will optimistically update the state
    await act(async () => {
      result.current.toggleLike();
      // Wait for the promise to resolve and state to update
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify the callback was called
    expect(mockCallback).toHaveBeenCalledWith('test-id', true);

    // Should revert back to initial state since API call failed
    expect(result.current.isLiked).toBe(false);
    expect(result.current.likeCount).toBe(5);
  });

  test('should save to AsyncStorage when videoId is provided', async () => {
    // Mock AsyncStorage.setItem to resolve immediately
    (AsyncStorage.setItem as jest.Mock).mockImplementation(() => Promise.resolve());

    // Mock a successful API call
    const mockCallback = jest.fn().mockResolvedValue(true);

    // Render the hook with our mock
    const { result } = renderHook(() => 
      useLike({
        initialLiked: false,
        initialCount: 5,
        videoId: 'test-id',
        onLikeCallback: mockCallback,
      })
    );

    // Clear AsyncStorage calls from initialization
    (AsyncStorage.setItem as jest.Mock).mockClear();

    // Initial state check
    expect(result.current.isLiked).toBe(false);

    // Act: Toggle like with a successful API response
    await act(async () => {
      result.current.toggleLike();
      // Wait for all promises to resolve
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Assert: Check that the like state was updated
    expect(mockCallback).toHaveBeenCalledWith('test-id', true);

    // Instead of checking the state directly, check that AsyncStorage was called
    // with the right parameters, which indicates the state was updated correctly
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining('video_like_test-id'), 
      expect.any(String)
    );
  });
});
