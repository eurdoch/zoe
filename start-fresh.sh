#!/bin/bash

# Stop any running Metro server
pkill -f "react-native start" || true

# Clear caches
rm -rf $TMPDIR/metro-* || true
rm -rf $TMPDIR/haste-map-* || true
rm -rf node_modules/.cache || true
watchman watch-del-all 2>/dev/null || true

# Start metro with clean cache
npm start -- --reset-cache