#!/bin/bash

# Usage: ./run-app.sh [ios|android]

# Stop any running Metro server
pkill -f "react-native start" || true

# Clear caches
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
watchman watch-del-all 2>/dev/null || true

# Start Metro server in the background
echo "Starting Metro server..."
npm start -- --reset-cache &
METRO_PID=$!

# Wait for Metro server to start
sleep 5

# Run the app on the specified platform
if [ "$1" == "android" ]; then
  echo "Running on Android..."
  npm run android
elif [ "$1" == "ios" ]; then
  echo "Running on iOS..."
  npm run ios
else
  echo "No platform specified. Usage: ./run-app.sh [ios|android]"
  kill $METRO_PID
  exit 1
fi

# When the app is closed, kill the Metro server
trap "kill $METRO_PID" EXIT