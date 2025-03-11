import React from 'react';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/Homescreen.tsx';
import CameraScreen from '../screens/Camerascreen.tsx';
import {
  createBottomTabNavigator,
  TransitionSpecs,
} from '@react-navigation/bottom-tabs';
import Icon from '@react-native-vector-icons/ionicons';

// const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        animation: 'fade',
        transitionSpec: TransitionSpecs.FadeSpec,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CameraScreen}
        options={{
            tabBarStyle: { display: 'none' },
            headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="journal" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// function RootStack() {
//   return (
//     <Stack.Navigator>
//       <Stack.Screen name="Home" component={HomeScreen} />
//     </Stack.Navigator>
//   );
// }

export default TabNavigator;
