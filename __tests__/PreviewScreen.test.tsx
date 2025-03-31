import React from 'react';
import {Alert} from 'react-native';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import PreviewScreen from '../src/screens/Previewscreen.tsx';
import Video from 'react-native-video';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: {videoPath: 'file:///path/to/video.mp4'},
  }),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}));

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

  it('roept navigation.goBack aan wanneer op "Close" wordt gedrukt', () => {
    const {getByText} = render(<PreviewScreen />);
    const closeButton = getByText('Close');
    fireEvent.press(closeButton);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('stuurt video via fetch en navigeert bij een succesvolle response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(
        JSON.stringify({
          message: 'Upload success',
          size: 16732687,
          filename: 'somefilename',
        }),
      ),
    });

    const {getByText} = render(<PreviewScreen />);
    const sendButton = getByText('Send Video');
    fireEvent.press(sendButton);

    await waitFor(() => {
      // Controleer dat fetch aangeroepen wordt met de juiste URL en opties
      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/videos',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }),
      );
      // Controleer dat navigation.navigate wordt aangeroepen met "CameraScreen"
      expect(mockNavigate).toHaveBeenCalledWith('CameraScreen');
    });
  });

  it('laat een Alert zien wanneer de response niet ok is', async () => {
    // Simuleer een response met fout (ok: false)
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue('error'),
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const {getByText} = render(<PreviewScreen />);
    const sendButton = getByText('Send Video');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Unable to send video');
    });
  });

  it('laat een Alert zien wanneer er een fetch-error optreedt', async () => {
    // Simuleer een fetch die een fout gooit
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const {getByText} = render(<PreviewScreen />);
    const sendButton = getByText('Send Video');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to send video');
    });
  });
