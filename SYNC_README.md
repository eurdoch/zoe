# Remote Database Sync Feature

This README provides an overview of the sync functionality added to the Zoe app.

## Overview

The sync feature allows the app to synchronize local Realm data with a remote database when `SYNC_ENABLED` is set to `true` in the config file. This gives users the ability to:

1. Use the app offline
2. Sync data when an internet connection becomes available
3. Share data across multiple devices

## Key Components

### Configuration (`config.ts`)

Contains settings to control the sync behavior:
- `SYNC_ENABLED`: Toggle to enable/disable syncing
- `API_BASE_URL`: The base URL for the remote API
- `SYNC_CONFIG`: Settings for sync frequency, retries, etc.

### Sync Service (`services/SyncService.ts`)

A service that handles the synchronization process:
- Automatic syncing on app start and when returning to foreground
- Periodic sync based on configured intervals
- Manual sync functionality
- Error handling and retry logic

### Hooks (`hooks/useSyncService.ts`)

A React hook for components to access the sync functionality:
- Get sync status information
- Trigger manual sync
- Enable/disable syncing

### UI Components (`components/SyncStatusIndicator.tsx`)

A visual indicator showing the current sync status:
- Sync status icon (idle, syncing, success, error)
- Last sync time
- Error messages
- Trigger manual sync

## Network Layer Updates

The network layer has been modified to:
1. Store data locally in Realm first
2. Immediately attempt to sync new data with the server if sync is enabled
3. Gracefully handle offline mode

## How to Use

### Enabling/Disabling Sync

To enable sync, set `SYNC_ENABLED` to `true` in `config.ts`. Configure the API endpoint and other settings as needed.

### Server API Requirements

The server API should support these endpoints:
- `GET /exercise`: Retrieve all exercises
- `POST /exercise`: Create or update exercises
- `GET /workout`: Retrieve all workouts
- `POST /workout`: Create or update workouts
- `GET /weight`: Retrieve all weight entries
- `POST /weight`: Create or update weight entries

Each endpoint should handle batch operations for efficient syncing.

### Conflict Resolution

The current implementation uses a simple "last write wins" strategy for conflicts. This can be enhanced with more sophisticated conflict resolution strategies if needed.