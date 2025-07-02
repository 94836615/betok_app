This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

## Android SDK License Issues

If you encounter errors related to Android SDK licenses not being accepted (especially for NDK components), you can use the built-in script to automatically accept all licenses:

```sh
# Using npm
npm run accept-android-licenses

# OR using Yarn
yarn accept-android-licenses
```

This script will automatically find your Android SDK location and accept all licenses. The Android build scripts (`npm run android`, `npm run e2e:build:android`, etc.) already include this step, but you can run it separately if needed.

If you still encounter license issues, you can manually accept the licenses using the Android SDK Manager:

```sh
# On Windows
sdkmanager.bat --licenses

# On macOS/Linux
sdkmanager --licenses
```

For more general troubleshooting, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Testing

## Unit Tests

To run the unit tests:

```sh
npm run test
```

## End-to-End Tests

### Detox

This project uses [Detox](https://github.com/wix/Detox) for end-to-end testing. For detailed instructions on setting up and running the e2e tests, see the [e2e/README.md](e2e/README.md) file.

Quick start:

```sh
# For Android
npm run e2e:build:android
npm run e2e:test:android

# For iOS
npm run e2e:build:ios
npm run e2e:test:ios
```

### Maestro

This project also uses [Maestro](https://maestro.mobile.dev/) for mobile UI testing. Maestro provides a simple way to write and run UI tests for mobile apps.

To install Maestro:

```sh
# macOS
curl -Ls "https://get.maestro.mobile.dev" | bash

# Windows
curl -Ls "https://get.maestro.mobile.dev" | bash
```

To run Maestro tests:

```sh
# For Android
maestro test maestro/samples/betok-flow.yaml

# For iOS
maestro test maestro/samples/ios-flow.yaml
```

Maestro tests are located in the `maestro/samples` directory. The `android-flow.yaml` file contains tests for the Android app, covering key user flows such as:

- Launching the app
- Verifying the home screen loads with videos
- Testing video playback (pause/play)
- Testing scrolling through videos
- Testing liking a video
- Testing comments functionality
- Testing sharing functionality

For more information about Maestro, visit the [Maestro documentation](https://maestro.mobile.dev/getting-started/installing-maestro).

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
