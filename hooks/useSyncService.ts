import { useState, useEffect } from 'react';
import { useRealm } from '@realm/react';
import { syncService, SyncInfo, SyncStatus } from '../services/SyncService';
import { SYNC_ENABLED } from '../config';

export function useSyncService() {
  const realm = useRealm();
  const [syncInfo, setSyncInfo] = useState<SyncInfo>({
    status: SyncStatus.IDLE,
    lastSyncTime: null,
    error: null,
  });
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(SYNC_ENABLED);

  useEffect(() => {
    // Initialize sync service with realm instance
    syncService.initialize(realm);
    
    // Set up timer to periodically refresh sync status
    const statusInterval = setInterval(() => {
      setSyncInfo(syncService.getSyncInfo());
    }, 1000);
    
    return () => {
      clearInterval(statusInterval);
      syncService.cleanup();
    };
  }, [realm]);

  // Manually trigger a sync
  const syncNow = async () => {
    if (!isSyncEnabled) return false;
    return await syncService.syncAll();
  };

  // Enable/disable sync (could be used from settings screen)
  const toggleSync = (enabled: boolean) => {
    setIsSyncEnabled(enabled);
    
    if (enabled) {
      syncService.startAutoSync();
    } else {
      syncService.stopAutoSync();
    }
  };

  return {
    syncInfo,
    isSyncEnabled,
    syncNow,
    toggleSync,
  };
}