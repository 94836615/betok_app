// src/utils/share-utils.ts
import Clipboard from '@react-native-clipboard/clipboard';
import { Alert } from 'react-native';

/**
 * Copies a link to the clipboard and shows a confirmation alert
 * @param link The link to copy
 */
export const copyLinkToClipboard = (link: string): void => {
  Clipboard.setString(link);
  Alert.alert('Link Copied', 'Video link has been copied to clipboard!');
};

/**
 * Shares a video by copying its URL to clipboard
 * @param videoUrl The complete URL of the video to share
 * @returns string - The shared URL
 */
export const shareVideo = (videoUrl: string): string => {
  copyLinkToClipboard(videoUrl);
  return videoUrl;
};

export default {
  copyLinkToClipboard,
  shareVideo,
};
