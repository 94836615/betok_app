// src/utils/user-utils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const DEVICE_ID_KEY = 'betok_device_id_v1';
console.log('Device ID key:', DEVICE_ID_KEY);
// In-memory cache of the device ID
let cachedDeviceId: string | null = null;

/**
 * Gets the device-specific unique ID, creating one if it doesn't exist
 */
export const getDeviceId = async (): Promise<string> => {
  // Return cached value if available
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    // Try to get the existing device ID
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (storedId) {
      // Use existing ID
      cachedDeviceId = storedId;
      return storedId;
    } else {
      // Generate a new ID
      const newId = uuid.v4().toString();
      await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
      cachedDeviceId = newId;
      console.log('Generated new device ID:', newId);
      return newId;
    }
  } catch (error) {
    // If storage fails, generate a temporary ID
    console.error('Error accessing device storage:', error);
    const tempId = uuid.v4().toString(); // Fixed to use uuid.v4()
    cachedDeviceId = tempId;
    return tempId;
  }
};

// Function to ensure UUID is in the correct format
export const formatUUID = (id: string): string => {
  // Check if it's already in correct UUID format (8-4-4-4-12)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidPattern.test(id)) {
    return id;
  }

  // If it's not in the correct format but has 32 characters, add hyphens
  if (id.length === 32) {
    return `${id.substring(0, 8)}-${id.substring(8, 12)}-${id.substring(12, 16)}-${id.substring(16, 20)}-${id.substring(20)}`;
  }

  // If we can't format it, return as is
  return id;
};
