import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// Instead of exporting the promise directly, we'll create a function to get the URL
let resolvedBaseUrl: string | null = null;

export const getApiBaseUrl = async (): Promise<string> => {
  // Return cached value if we've already resolved it
  if (resolvedBaseUrl) {
    return resolvedBaseUrl;
  }
  
  if (__DEV__) {
    const isEmulator = await DeviceInfo.isEmulator();
    resolvedBaseUrl = isEmulator
      ? Platform.select({
          android: 'http://10.0.2.2:3000',
          ios: 'http://localhost:3000',
        }) || 'http://10.0.2.2:3000'
      : 'https://directto.link';
  } else {
    resolvedBaseUrl = 'https://directto.link';
  }
  
  console.log('API_BASE_URL resolved to: ', resolvedBaseUrl);
  return resolvedBaseUrl;
};

// For backward compatibility, keep the original export but warn about it
export const API_BASE_URL = __DEV__
  ? DeviceInfo.isEmulator().then(isEmulator => {
      console.warn('Direct use of API_BASE_URL is deprecated. Use getApiBaseUrl() instead.');
      return isEmulator
        ? Platform.select({
            android: 'http://10.0.2.2:3000',
            ios: 'http://localhost:3000',
          }) || 'http://10.0.2.2:3000'
        : 'https://directto.link';
    })
  : 'https://directto.link';

// Application settings
export const APP_SETTINGS = {
  // Whether to show detailed error messages
  showDetailedErrors: __DEV__,
  
  // Whether to use verbose console logging
  debugLogging: __DEV__,
  
  // Network request timeout in milliseconds
  networkTimeout: 30000, // 30 seconds
  
  // Number of retries for network requests
  networkRetries: 3,
};
