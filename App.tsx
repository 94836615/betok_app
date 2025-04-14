import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import RootStack from './src/navigation/Navigation.tsx';
import { setJSExceptionHandler } from 'react-native-exception-handler';

function App(): React.JSX.Element {
  // Set up global error handling
  setJSExceptionHandler((error, _isFatal) => {
    console.log(`Caught JS Error: ${error.name} ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    // Log to a service like Crashlytics
  }, true);

  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}

export default App;
