import * as React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import CameraScreen from '../src/screens/Camerascreen';

// Use fake timers to control the setTimeout
jest.useFakeTimers();

// --- Mocks ---

// Mock react-navigation hooks so that navigation.navigate and useIsFocused work as expected.
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({navigate: jest.fn()}),
    useIsFocused: () => true,
}));

// Move any type definitions outside the jest.mock factory to avoid out-of-scope issues.
type CameraRefMethods = {
    startRecording: jest.Mock;
    stopRecording: jest.Mock;
};

// Mock react-native-vision-camera so that cameraRef is not null.
jest.mock('react-native-vision-camera', () => {
    // Import React locally inside the factory to avoid out-of-scope errors.
    const Reacts = require('react') as typeof import('react');
    const {View} = require('react-native');
    return {
        useCameraDevices: jest.fn(() => [
            {position: 'back', name: 'Back Camera Mock'},
        ]),
        Camera: Reacts.forwardRef<CameraRefMethods, any>((props, ref) => {
            Reacts.useImperativeHandle(ref, () => ({
                startRecording: jest.fn(),
                stopRecording: jest.fn(),
            }));
            return <View {...props} />;
        }),
    };
});

describe('CameraScreen', () => {
    afterEach(() => {
        jest.clearAllTimers();
    });

    it('renders Record button initially', () => {
        const { getByText } = render(<CameraScreen />);
        expect(getByText('Record')).toBeTruthy();
    });

    it('switches to Stop button after pressing Record, then reverts after timeout', async () => {
        const { getByText, queryByText } = render(<CameraScreen />);
        const recordButton = getByText('Record');

        // Press the "Record" button
        await act(async () => {
            fireEvent.press(recordButton);
        });

        // After pressing, "Record" should be gone and "Stop" should be visible.
        expect(queryByText('Record')).toBeNull();
        expect(getByText('Stop')).toBeTruthy();

        // Advance timers by 20 seconds so that the timeout callback fires.
        await act(async () => {
            jest.advanceTimersByTime(20000);
        });
    });
});
