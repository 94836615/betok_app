import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './Navigation.tsx';
import SharedVideoScreen from '../screens/SharedVideoScreen.tsx';

// Define the root stack param list for type safety
export type RootStackParamList = {
  Main: undefined;
  SharedVideo: { videoId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SharedVideo"
        component={SharedVideoScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default RootStack;
