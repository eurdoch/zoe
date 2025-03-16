// App configuration settings

// Whether to sync with remote database
export const SYNC_ENABLED = true;

// Whether to use mock API (for development without a real server)
export const USE_MOCK_API = false;

// Remote API base URL
export const API_BASE_URL = 'https://directto.link';

// Sync configuration
export const SYNC_CONFIG = {
  // How often to sync data (in milliseconds)
  syncInterval: 60000, // 1 minute
  
  // Max number of retries if sync fails
  maxRetries: 3,
  
  // Whether to sync automatically on app start
  syncOnStart: true,
  
  // Whether to sync automatically when app comes to foreground
  syncOnForeground: true,
  
  // Whether to show toast notifications for sync failures
  showSyncFailureToasts: __DEV__ ? false : true,
  
  // Timeout for sync operations in milliseconds
  timeout: 30000, // 30 seconds
};
