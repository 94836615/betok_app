import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import RootStack from './src/navigation/RootStack.tsx';
import { setJSExceptionHandler } from 'react-native-exception-handler';
import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './src/navigation/RootStack.tsx';

function App(): React.JSX.Element {
  // Set up global error handling
  setJSExceptionHandler((error, _isFatal) => {
    console.log(`Caught JS Error: ${error.name} ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    // Log to a service like Crashlytics
  }, true);

  // Configure deep linking
  const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['betok://app', 'https://betok.app', 'https://minio.noahnap.nl'],
    config: {
      screens: {
        Main: {
          screens: {
            Home: 'home',
            Create: 'create',
          },
        },
        SharedVideo: 'videos/:videoId(.mov)?',
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <RootStack />
    </NavigationContainer>
  );
}

export default App;
