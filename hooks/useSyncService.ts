import { useState } from 'react';
import { SYNC_ENABLED } from '../config';

// Define sync status for backward compatibility
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

export function useSyncService() {
  const [syncInfo, setSyncInfo] = useState<SyncInfo>({
    status: SyncStatus.IDLE,
    lastSyncTime: null,
    error: null,
  });
  const [isSyncEnabled] = useState<boolean>(false);

  // Dummy function for compatibility
  const syncNow = async () => {
    return false;
  };

  // Dummy function for compatibility
  const toggleSync = (_enabled: boolean) => {
    // No-op
  };

  return {
    syncInfo,
    isSyncEnabled,
    syncNow,
    toggleSync,
  };
}