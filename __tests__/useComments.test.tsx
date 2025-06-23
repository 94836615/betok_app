import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useComments } from '../src/hooks/useComments';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock setTimeout and console
global.setTimeout = jest.fn((cb) => cb());
console.error = jest.fn();
console.log = jest.fn();

describe('useComments Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useComments({ videoId: 'test-video' }));

    expect(result.current.comments).toEqual([]);
    expect(result.current.commentCount).toBe(0);
    expect(result.current.formattedCount).toBe('0');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should initialize with provided initialCommentCount', () => {
    const { result } = renderHook(() =>
      useComments({
        videoId: 'test-video',
        initialCommentCount: 10
      })
    );

    expect(result.current.commentCount).toBe(10);
    expect(result.current.formattedCount).toBe('10');
  });

  test('should format comment counts correctly', () => {
    // Test regular numbers
    const { result: result1 } = renderHook(() =>
      useComments({ videoId: 'test-video', initialCommentCount: 42 })
    );
    expect(result1.current.formattedCount).toBe('42');

    // Test thousands with formatting
    const { result: result2 } = renderHook(() =>
      useComments({ videoId: 'test-video', initialCommentCount: 1234 })
    );
    expect(result2.current.formattedCount).toBe('1.2K');

    // Test larger numbers
    const { result: result3 } = renderHook(() =>
      useComments({ videoId: 'test-video', initialCommentCount: 42000 })
    );
    expect(result3.current.formattedCount).toBe('42.0K');
  });
});
