#!/bin/bash

# Function to select device
select_device() {
    # Get list of connected devices
    devices=($(adb devices | grep -v "List" | grep "device$" | cut -f1))
    
    if [ ${#devices[@]} -eq 0 ]; then
        echo "No Android devices connected!"
        echo "Checking for iOS devices..."
        ios_devices=($(system_profiler SPUSBDataType | grep "iPhone" | awk '{print $6}' | sed 's/://'))
        if [ ${#ios_devices[@]} -eq 0 ]; then
            echo "No iOS devices connected either!"
            exit 1
        else
            echo "iOS devices found: ${ios_devices[@]}"
            select ios_device in "${ios_devices[@]}"; do
                if [ -n "$ios_device" ]; then
                    selected_device=$ios_device
                    is_ios=true
                    break
                fi
            done
        fi
    elif [ ${#devices[@]} -eq 1 ]; then
        echo "Only one Android device connected. Using ${devices[0]}"
        selected_device=${devices[0]}
    else
        echo "Multiple Android devices found. Please select a device:"
        select device in "${devices[@]}"; do
            if [ -n "$device" ]; then
                selected_device=$device
                break
            fi
        done
    fi
    
    echo "Selected device: $selected_device"
}

# Main script
current_dir=$(pwd)
cd $current_dir
cd android
./gradlew tasks
cd ..

# Bundle the app
if [ "$is_ios" = true ]; then
    npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle --assets-dest ios
else
    npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
fi

if [ "$is_ios" = true ]; then
    cd ios
    xcodebuild -scheme YourAppName
    cd ..
    open ios/build/Build/Products/Debug-iphoneos/YourAppName.app
else
    cd android
    ./gradlew assembleDebug

    # Select device and install
    select_device
    adb -s $selected_device install app/build/outputs/apk/debug/app-debug.apk
fi

