import React from 'react';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/Homescreen.tsx';
import {
  createBottomTabNavigator,
  TransitionSpecs,
} from '@react-navigation/bottom-tabs';
import Icon from '@react-native-vector-icons/ionicons';
import {CameraStack} from './Camerastack.tsx';

// const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function journalIcon({color, size}: {color: string; size: number}) {
  return <Icon name="journal" color={color} size={size} />;
}

function HomeIcon({color, size}: {color: string; size: number}) {
  return <Icon name="home" color={color} size={size} />;
}

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
          tabBarIcon: HomeIcon,
            headerShown: false,
        }}
      />
      <Tab.Screen
        name="Create"
        component={CameraStack}
        options={{
          tabBarStyle: {display: 'none'},
          headerShown: false,
          tabBarIcon: journalIcon,
        }}
      />
    </Tab.Navigator>
  );
}

export default TabNavigator;
