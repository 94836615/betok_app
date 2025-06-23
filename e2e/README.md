# End-to-End Testing with Detox

This directory contains end-to-end tests for the Betok app using [Detox](https://github.com/wix/Detox).

## Prerequisites

Before running the tests, make sure you have the following installed:

### For both iOS and Android
- Node.js (v18 or higher)
- Detox CLI: `npm install -g detox-cli`

### For iOS
- Xcode
- AppleSimUtils: `brew tap wix/brew && brew install applesimutils`

### For Android
- Android Studio
- Java Development Kit (JDK) 11
- Android SDK
- An Android emulator (Pixel_8_Pro_Edited_API_35 recommended)

## Running the Tests

### Building the App for Testing

Before running the tests, you need to build the app in the appropriate configuration:

#### For Android Debug
```bash
npm run e2e:build:android
```

#### For iOS Debug
```bash
npm run e2e:build:ios
```

### Running the Tests

After building, you can run the tests:

#### For Android Debug
```bash
npm run e2e:test:android
```

#### For iOS Debug
```bash
npm run e2e:test:ios
```

### Running Tests in Release Mode

For testing the release version of the app:

#### For Android Release
```bash
npm run e2e:build:android:release
npm run e2e:test:android:release
```

#### For iOS Release
```bash
npm run e2e:build:ios:release
npm run e2e:test:ios:release
```

## Test Structure

- `firstTest.test.js`: Basic test to verify the setup works correctly
- `videoInteractions.test.js`: Tests for video playback, liking, commenting, and sharing functionality

## Adding New Tests

When adding new tests, make sure to:

1. Add appropriate testID props to the components you want to test
2. Use the Detox API to interact with the app
3. Follow the existing test structure

## Troubleshooting

If you encounter issues:

- Make sure all prerequisites are installed
- Check that the emulator/simulator is running
- Verify that the app builds correctly
- Check the Detox logs for more information

For more information, see the [Detox documentation](https://github.com/wix/Detox/blob/master/docs/README.md).
