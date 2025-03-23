import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import RootStack from './src/navigation/Navigation.tsx';

function App(): React.JSX.Element {

  return (
    <NavigationContainer> # Test comment
      <RootStack />
    </NavigationContainer>
  );
}


export default App;
