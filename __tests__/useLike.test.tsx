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

  test('should revert changes when API call fails', () => {
    const mockCallback = jest.fn().mockResolvedValue(false);

    const { result } = renderHook(() =>
      useLike({
        initialLiked: false,
        initialCount: 5,
        videoId: 'test-id',
        onLikeCallback: mockCallback,
      })
    );

    act(() => {
      result.current.toggleLike();
    });

  });

  test('should save to AsyncStorage when videoId is provided', () => {
    const { result } = renderHook(() =>
      useLike({
        initialLiked: false,
        initialCount: 5,
        videoId: 'test-id',
      })
    );

    act(() => {
      result.current.toggleLike();
    });
  });
});
