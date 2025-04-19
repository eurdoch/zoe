// App configuration settings

// Remote API base URL
export const API_BASE_URL = 'https://directto.link';

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