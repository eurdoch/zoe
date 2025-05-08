// App configuration settings
import { Platform } from 'react-native';

// Remote API base URL - use special addresses for development, remote URL in production
export const API_BASE_URL = __DEV__ 
  ? Platform.select({
      // 10.0.2.2 is the special IP that allows Android emulator to access host machine's localhost
      // 10.0.3.2 works for GenyMotion
      // localhost works for iOS simulator
      android: 'http://10.0.2.2:3000',
      ios: 'http://localhost:3000',
      // Use this when testing on physical device - replace with your computer's local network IP
      // default: 'http://192.168.x.x:3000'
    }) || 'http://10.0.2.2:3000'
  : 'https://directto.link';

// For backward compatibility
export const SYNC_ENABLED = false;

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