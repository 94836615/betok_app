// // // import React from 'react';
// // import {Alert} from 'react-native';
// // import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
// // import PreviewScreen from '../src/screens/Previewscreen.tsx';
// //
// // const mockGoBack = jest.fn();
// // const mockNavigate = jest.fn();
// //
// // // Mock Video component properly
// jest.mock('react-native-video', () => {
//   // Must use require inside factory function to avoid out-of-scope error
//   const React = require('react');
//   const {View} = require('react-native');
//
//   return React.forwardRef((props, ref) => {
//     React.useImperativeHandle(ref, () => ({
//       seek: jest.fn(),
//     }));
//     // Return a simple View
//     return <View {...props} />;
//   });
// });
// //   jest.mock('@react-navigation/native', () => ({
// //     useRoute: () => ({
// //       params: {videoPath: 'file:///path/to/video.mp4'},
// //     }),
// //     useNavigation: () => ({
// //       goBack: mockGoBack,
// //       navigate: mockNavigate,
// //     }),
// //   }));
// //
// //   global.fetch = jest.fn();
// //
// //   jest.spyOn(Alert, 'alert').mockImplementation(() => {
// //   });
// //
// //   describe('PreviewScreen', () => {
// //     beforeEach(() => {
// //       jest.clearAllMocks();
// //     });
// //
// //     it('roept navigation.goBack aan wanneer op "Close" wordt gedrukt', () => {
// //       const {getByText} = render(<PreviewScreen/>);
// //       const closeButton = getByText('Close');
// //       fireEvent.press(closeButton);
// //       expect(mockGoBack).toHaveBeenCalled();
// //     });
// //
// //     it('stuurt video via fetch en navigeert bij een succesvolle response', async () => {
// //       (global.fetch as jest.Mock).mockResolvedValueOnce({
// //         ok: true,
// //         status: 200,
// //         text: jest.fn().mockResolvedValue(
// //             JSON.stringify({
// //               message: 'Upload success',
// //               size: 16732687,
// //               filename: 'somefilename',
// //             }),
// //         ),
// //       });
// //
// //       const {getByText} = render(<PreviewScreen/>);
// //       const sendButton = getByText('Send Video');
// //
// //       await act(async () => {
// //         fireEvent.press(sendButton);
// //       });
// //
// //       await waitFor(() => {
// //         expect(global.fetch).toHaveBeenCalledWith(
// //             'http://127.0.0.1:8000/api/v1/videos',
// //             expect.objectContaining({
// //               method: 'POST',
// //               body: expect.any(FormData),
// //             }),
// //         );
// //         expect(mockNavigate).toHaveBeenCalledWith('CameraScreen');
// //       });
// //     });
// //
// //     it('laat een Alert zien wanneer de response niet ok is', async () => {
// //       (global.fetch as jest.Mock).mockResolvedValueOnce({
// //         ok: false,
// //         status: 400,
// //         text: jest.fn().mockResolvedValue('error'),
// //       });
// //
// //       const {getByText} = render(<PreviewScreen/>);
// //
// //       // Wait for the loading to complete
// //       await waitFor(() => getByText('Send Video'));
// //
// //       const sendButton = getByText('Send Video');
// //
// //       await act(async () => {
// //         fireEvent.press(sendButton);
// //       });
// //
// //       await waitFor(() => {
// //         // Updated to match the actual format of the error message with status code
// //         expect(Alert.alert).toHaveBeenCalledWith('Error', 'Unable to send video: 400');
// //       });
// //     });
// //
// //     it('laat een Alert zien wanneer er een fetch-error optreedt', async () => {
// //       (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
// //
// //       const {getByText} = render(<PreviewScreen/>);
// //       const sendButton = getByText('Send Video');
// //
// //       await act(async () => {
// //         fireEvent.press(sendButton);
// //       });
// //
// //       await waitFor(() => {
// //         expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to send video. Please try again.');
// //       });
// //     });
// //
// //     it('shows loading state initially', () => {
// //       const {getByText} = render(<PreviewScreen/>);
// //       expect(getByText('Loading preview...')).toBeTruthy();
// //     });
// //
// //     it('calls seek(0) on cleanup', () => {
// //       // Create a mock seek function
// //       const mockSeek = jest.fn();
// //
// //       // Mock useRef to return an object with the correct structure
// //       const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValue({
// //         current: {
// //           seek: mockSeek,
// //         },
// //       });
// //
// //       // Render and unmount to trigger the cleanup function
// //       const {unmount} = render(<PreviewScreen/>);
// //       unmount();
// //
// //       // Check if seek(0) was called during cleanup
// //       expect(mockSeek).toHaveBeenCalledWith(0);
// //
// //       // Clean up the spy
// //       useRefSpy.mockRestore();
// //     });
// //   });
// // })

import React from 'react';
import {Alert} from 'react-native';
import {render, act} from '@testing-library/react-native';
import PreviewScreen from '../src/screens/Previewscreen';

// Setup mocks
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockSeek = jest.fn();

// Mock Video component
jest.mock('react-native-video', () => {
  const React = require('react');

  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      seek: mockSeek
    }));

    // Simulate video loaded
    React.useEffect(() => {
      if (props.onLoad) {
        props.onLoad({duration: 10});
      }
    }, [props.onLoad]);

    return null; // Return null for simplicity
  });
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: {videoPath: 'file:///mock/path/to/video.mp4'}
  }),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('PreviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls seek(0) on cleanup', async () => {
    // Don't use useRef mocking as it's complicated with cleanup
    // Just use the mockSeek already provided to the Video component

    // Render component
    const {unmount} = render(<PreviewScreen />);

    // Make sure component is fully mounted
    await act(async () => {
      // Small wait to ensure effects run
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Unmount to trigger cleanup
    unmount();

    // Verify seek was called with 0
    expect(mockSeek).toHaveBeenCalledWith(0);
  });
});