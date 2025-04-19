import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSyncService, SyncStatus } from '../hooks/useSyncService';
import { SYNC_ENABLED } from '../config';

const SyncStatusIndicator: React.FC = () => {
  const { syncInfo, syncNow } = useSyncService();
  
  if (!SYNC_ENABLED) return null;

  const getStatusIcon = () => {
    switch (syncInfo.status) {
      case SyncStatus.SYNCING:
        return { name: 'sync', color: '#2196F3' };
      case SyncStatus.SUCCESS:
        return { name: 'check-circle', color: '#4CAF50' };
      case SyncStatus.ERROR:
        return { name: 'error', color: '#F44336' };
      default:
        return { name: 'cloud', color: '#9E9E9E' };
    }
  };

  const { name, color } = getStatusIcon();
  
  const lastSyncText = syncInfo.lastSyncTime
    ? `Last sync: ${syncInfo.lastSyncTime.toLocaleTimeString()}`
    : 'Not synced yet';

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button}
        onPress={syncNow}
        disabled={syncInfo.status === SyncStatus.SYNCING}
      >
        <Icon name={name} size={24} color={color} />
        <Text style={styles.text}>
          {syncInfo.status === SyncStatus.SYNCING ? 'Syncing...' : 'Sync Now'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.lastSync}>{lastSyncText}</Text>
      {syncInfo.error && (
        <Text style={styles.error}>Sync error: {syncInfo.error.message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  lastSync: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
});

export default SyncStatusIndicator;