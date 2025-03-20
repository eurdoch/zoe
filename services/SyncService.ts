import { AppState, AppStateStatus } from 'react-native';
import { Realm } from '@realm/react';
import { SYNC_ENABLED, API_BASE_URL, SYNC_CONFIG } from '../config';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

// Type for representing the sync status
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
}

// Type for sync operation info
export interface SyncInfo {
  status: SyncStatus;
  lastSyncTime: Date | null;
  error: Error | null;
}

class SyncService {
  private realm: Realm | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private retryCount: number = 0;
  private syncInfo: SyncInfo = {
    status: SyncStatus.IDLE,
    lastSyncTime: null,
    error: null,
  };
  private isSyncing: boolean = false;
  private appStateSubscription: any = null;

  constructor() {
    // Listen for app state changes to sync when app comes to foreground
    if (SYNC_CONFIG.syncOnForeground) {
      // In newer versions of React Native, addEventListener returns an event subscription
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    }
  }

  // Initialize the service with a realm instance
  initialize(realm: Realm): void {
    this.realm = realm;
    
    // Start automatic sync if enabled
    if (SYNC_ENABLED && SYNC_CONFIG.syncOnStart) {
      this.startAutoSync();
    }
  }

  // Start automatic sync based on the configured interval
  startAutoSync(): void {
    if (!SYNC_ENABLED) return;
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    // Perform initial sync
    this.syncAll();
    
    // Set up recurring sync
    this.syncTimer = setInterval(() => {
      this.syncAll();
    }, SYNC_CONFIG.syncInterval);
  }

  // Stop automatic sync
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Manually trigger sync for all data
  async syncAll(): Promise<boolean> {
    if (!SYNC_ENABLED || this.isSyncing || !this.realm) return false;
    
    try {
      // Check for internet connection
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('No internet connection, skipping sync');
        return false;
      }
      
      this.isSyncing = true;
      this.syncInfo.status = SyncStatus.SYNCING;
      
      // Check if server is reachable by trying to access one of the actual endpoints
      try {
        // Create an AbortController with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // We'll try the supplement endpoint as an alternative to exercise
        // This provides redundancy in case one endpoint is temporarily down
        const pingEndpoint = Math.random() > 0.5 ? 'exercise' : 'supplement';
        const pingResponse = await fetch(`${API_BASE_URL}/${pingEndpoint}`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Even if we get a 404 or other error, at least the server is responding
        // Only treat connection errors as "server unreachable"
      } catch (pingError) {
        console.log('Server unreachable, operating in offline mode');
        this.isSyncing = false;
        this.syncInfo.status = SyncStatus.IDLE;
        
        // Don't show error for server unavailability, just treat it as offline mode
        return false;
      }
      
      // Sync each data type, but don't fail completely if one type fails
      const results = await Promise.allSettled([
        this.syncExercises(),
        this.syncWorkouts(),
        this.syncWeights(),
        this.syncSupplements(),
        // Add other data types as needed
      ]);
      
      // Check if all promises were fulfilled or some were rejected
      const anyFailed = results.some(result => result.status === 'rejected');
      
      if (anyFailed) {
        console.warn('Some sync operations failed:');
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const dataTypes = ['exercises', 'workouts', 'weights', 'supplements'];
            console.warn(`- Failed to sync ${dataTypes[index]}: ${(result as PromiseRejectedResult).reason}`);
          }
        });
        
        this.syncInfo.status = SyncStatus.ERROR;
        this.syncInfo.error = new Error('Partial sync failure - some data types failed to sync');
      } else {
        this.syncInfo.status = SyncStatus.SUCCESS;
        this.syncInfo.error = null;
        this.retryCount = 0;
        console.log('Sync completed successfully');
      }
      
      this.syncInfo.lastSyncTime = new Date();
      this.isSyncing = false;
      
      return !anyFailed;
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncInfo.status = SyncStatus.ERROR;
      this.syncInfo.error = error as Error;
      this.isSyncing = false;
      
      // Retry sync if configured to do so
      if (this.retryCount < SYNC_CONFIG.maxRetries) {
        this.retryCount++;
        console.log(`Retrying sync (${this.retryCount}/${SYNC_CONFIG.maxRetries})...`);
        setTimeout(() => this.syncAll(), 5000); // Retry after 5 seconds
      } else {
        // Only show toast if configured to do so (might disable in development)
        if (SYNC_CONFIG.showSyncFailureToasts) {
          Toast.show({
            type: 'error',
            text1: 'Sync failed',
            text2: 'Could not sync with server after multiple attempts',
          });
        }
      }
      
      return false;
    }
  }

  // Helper function to find local data that needs to be pushed to server
  private findLocalItemsToSync(localItems: any[], serverItems: any[]): any[] {

    // Create a map of server IDs for quick lookup
    const serverIdMap = new Map(serverItems.map(item => [item._id, item]));
    
    // Filter local items that aren't on the server or have been updated since last sync
    return localItems.filter(localItem => {
      const serverItem = serverIdMap.get(localItem._id);
      
      // Case 1: Item doesn't exist on server
      if (!serverItem) {
        return true;
      }
      
      // Case 2: Item exists but local version is newer
      // Compare based on createdAt timestamp (or any other appropriate field)
      if (localItem.createdAt && serverItem.createdAt) {
        // Assume higher timestamp means newer version
        return localItem.createdAt > serverItem.createdAt;
      }
      
      // Case 3: Always prefer local data when both exist with same ID
      return true;
    });
  }
  
  // Helper function to find server data that needs to be pulled to local
  private findServerItemsToSync(localItems: any[], serverItems: any[]): any[] {
    // Create a map of local IDs for quick lookup
    const localIdMap = new Map(localItems.map(item => [item._id, item]));
    
    // Filter server items that don't exist locally
    return serverItems.filter(serverItem => {
      // Only add server items that don't exist locally
      return !localIdMap.has(serverItem._id);
    });
  }

  // Sync exercises data
  private async syncExercises(): Promise<void> {
    if (!this.realm) return;
    
    // Get all local exercises
    const exercises = this.realm.objects('ExerciseEntry');
    const localExercises = Array.from(exercises).map(item => ({...item}));
    
    // 1. PULL: Get all exercises from the server
    const response = await fetch(`${API_BASE_URL}/exercise`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exercises: ${response.statusText}`);
    }
    
    const serverExercises = await response.json();
    
    // 2. DETERMINE which local items need to be pushed to server
    const itemsToSync = this.findLocalItemsToSync(localExercises, serverExercises);
    console.log(`Found ${itemsToSync.length} exercises to sync to server`);
    
    // 3. PUSH: Send only new/updated local exercises to the server
    if (itemsToSync.length > 0) {
      await this.pushLocalData('exercise', itemsToSync);
    }
    
    // 4. DETERMINE which server items need to be pulled to local (ones not in local)
    const itemsToPull = this.findServerItemsToSync(localExercises, serverExercises);
    console.log(`Found ${itemsToPull.length} exercises to pull from server`);
    
    // 5. PULL: Add server items that don't exist locally
    if (itemsToPull.length > 0) {
      this.realm.write(() => {
        itemsToPull.forEach(item => {
          // Create a new exercise in the local database
          this.realm?.create('ExerciseEntry', item, Realm.UpdateMode.Modified);
        });
      });
    }
  }

  // Sync workouts data
  private async syncWorkouts(): Promise<void> {
    if (!this.realm) return;
    
    // Get all local workouts
    const workouts = this.realm.objects('WorkoutEntry');
    const localWorkouts = Array.from(workouts).map(item => ({...item}));
    
    // 1. PULL: Get all workouts from the server
    const response = await fetch(`${API_BASE_URL}/workout`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch workouts: ${response.statusText}`);
    }
    
    const serverWorkouts = await response.json();
    
    // 2. DETERMINE which local items need to be pushed to server
    const itemsToSync = this.findLocalItemsToSync(localWorkouts, serverWorkouts);
    console.log(`Found ${itemsToSync.length} workouts to sync to server`);
    
    // 3. PUSH: Send only new/updated local workouts to the server
    if (itemsToSync.length > 0) {
      await this.pushLocalData('workout', itemsToSync);
    }
    
    // 4. DETERMINE which server items need to be pulled to local (ones not in local)
    const itemsToPull = this.findServerItemsToSync(localWorkouts, serverWorkouts);
    console.log(`Found ${itemsToPull.length} workouts to pull from server`);
    
    // 5. PULL: Add server items that don't exist locally
    if (itemsToPull.length > 0) {
      this.realm.write(() => {
        itemsToPull.forEach(item => {
          // Create a new workout in the local database
          this.realm?.create('WorkoutEntry', item, Realm.UpdateMode.Modified);
        });
      });
    }
  }

  // Sync weights data
  private async syncWeights(): Promise<void> {
    if (!this.realm) return;
    
    // Get all local weights
    const weights = this.realm.objects('WeightEntry');
    const localWeights = Array.from(weights).map(item => ({...item}));
    
    // 1. PULL: Get all weights from the server
    const response = await fetch(`${API_BASE_URL}/weight`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch weights: ${response.statusText}`);
    }
    
    const serverWeights = await response.json();
    
    // 2. DETERMINE which local items need to be pushed to server
    const itemsToSync = this.findLocalItemsToSync(localWeights, serverWeights);
    console.log(`Found ${itemsToSync.length} weights to sync to server`);
    
    // 3. PUSH: Send only new/updated local weights to the server
    if (itemsToSync.length > 0) {
      await this.pushLocalData('weight', itemsToSync);
    }
    
    // 4. DETERMINE which server items need to be pulled to local (ones not in local)
    const itemsToPull = this.findServerItemsToSync(localWeights, serverWeights);
    console.log(`Found ${itemsToPull.length} weights to pull from server`);
    
    // 5. PULL: Add server items that don't exist locally
    if (itemsToPull.length > 0) {
      this.realm.write(() => {
        itemsToPull.forEach(item => {
          // Create a new weight in the local database
          this.realm?.create('WeightEntry', item, Realm.UpdateMode.Modified);
        });
      });
    }
  }
  
  // Sync supplements data
  private async syncSupplements(): Promise<void> {
    if (!this.realm) return;
    
    // Get all local supplements
    const supplements = this.realm.objects('SupplementEntry');
    const localSupplements = Array.from(supplements).map(item => ({...item}));
    
    // 1. PULL: Get all supplements from the server
    const response = await fetch(`${API_BASE_URL}/supplement`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch supplements: ${response.statusText}`);
    }
    
    const serverSupplements = await response.json();
    
    // 2. DETERMINE which local items need to be pushed to server
    const itemsToSync = this.findLocalItemsToSync(localSupplements, serverSupplements);
    console.log(`Found ${itemsToSync.length} supplements to sync to server`);
    
    // 3. PUSH: Send only new/updated local supplements to the server
    if (itemsToSync.length > 0) {
      await this.pushLocalData('supplement', itemsToSync);
    }
    
    // 4. DETERMINE which server items need to be pulled to local (ones not in local)
    const itemsToPull = this.findServerItemsToSync(localSupplements, serverSupplements);
    console.log(`Found ${itemsToPull.length} supplements to pull from server`);
    
    // 5. PULL: Add server items that don't exist locally
    if (itemsToPull.length > 0) {
      this.realm.write(() => {
        itemsToPull.forEach(item => {
          // Create a new supplement in the local database
          this.realm?.create('SupplementEntry', item, Realm.UpdateMode.Modified);
        });
      });
    }
  }

  // Push local data to the server
  private async pushLocalData(endpoint: string, data: any[]): Promise<void> {
    // Handle both Realm.Results and plain arrays for flexibility
    const plainData = Array.isArray(data) ? data : Array.from(data).map(item => {
      // Need to convert realm objects to plain objects if it's a Realm result
      return Object.keys(item).reduce((obj: any, key) => {
        if (key !== '_objectId') { // Skip Realm internal properties
          obj[key] = item[key];
        }
        return obj;
      }, {});
    });
    
    // Skip if no data to push
    if (plainData.length === 0) return;
    
    // Track failed items to report
    const failedItems: { id: string; error: string }[] = [];
    
    // Process each item individually
    for (const item of plainData) {
      try {
        // Set a timeout for each request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SYNC_CONFIG.timeout);
        
        // Send single item to server
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item), // Send just this item
          signal: controller.signal,
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorMsg = `Server returned ${response.status} ${response.statusText}`;
          console.warn(`Error pushing item ${item._id} to ${endpoint}: ${errorMsg}`);
          failedItems.push({ id: item._id, error: errorMsg });
        }
      } catch (error) {
        let errorMsg = 'Unknown error';
        
        // Check if this is an abort error (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          errorMsg = 'Request timeout';
        }
        // Is it a network error?
        else if (error instanceof TypeError && error.message.includes('Network request failed')) {
          errorMsg = 'Network request failed';
        }
        else if (error instanceof Error) {
          errorMsg = error.message;
        }
        
        console.warn(`Failed to push item ${item._id} to ${endpoint}: ${errorMsg}`);
        failedItems.push({ id: item._id, error: errorMsg });
      }
    }
    
    // If any items failed, throw an error with details
    if (failedItems.length > 0) {
      if (failedItems.length === plainData.length) {
        // All items failed - likely a server issue
        throw new Error(`Failed to push any data to ${endpoint}. Server might be down.`);
      } else {
        // Some items failed - partial success
        throw new Error(`Failed to push ${failedItems.length}/${plainData.length} items to ${endpoint}`);
      }
    }
  }

  // Handle app state changes (background/foreground)
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && SYNC_ENABLED && SYNC_CONFIG.syncOnForeground) {
      console.log('App came to foreground, syncing data...');
      this.syncAll();
    }
  };

  // Get the current sync status
  getSyncInfo(): SyncInfo {
    return { ...this.syncInfo };
  }

  // Cleanup resources
  cleanup(): void {
    this.stopAutoSync();
    // Remove the subscription in newer versions of React Native
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

// Export a singleton instance
export const syncService = new SyncService();
