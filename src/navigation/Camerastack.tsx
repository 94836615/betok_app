import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CameraScreen from '../screens/Camerascreen';
import PreviewScreen from '../screens/Previewscreen';

const CameraStackNav = createNativeStackNavigator();

export function CameraStack() {
    return (
        <CameraStackNav.Navigator>
            <CameraStackNav.Screen
                name="CameraScreen"
                component={CameraScreen}
                options={{ headerShown: false }}
            />
            <CameraStackNav.Screen
                name="PreviewScreen"
                component={PreviewScreen}
                // You can customize header if you need
                options={{ headerShown: false }}
            />
        </CameraStackNav.Navigator>
    );
}
