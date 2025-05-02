#!/bin/bash

# Script to generate Android screenshots using ADB
# Creates a directory for screenshots if it doesn't exist
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCREENSHOT_DIR="android/fastlane/metadata/android/en-US/images/phoneScreenshots"

# Create directories if they don't exist
mkdir -p "$SCREENSHOT_DIR"

# Check if ADB is installed
if ! command -v adb &> /dev/null; then
  echo "Error: ADB (Android Debug Bridge) is not installed or not in your PATH."
  echo "Please install the Android SDK and make sure ADB is available."
  exit 1
fi

# Check if a device is connected
if ! adb devices | grep -q "device$"; then
  echo "Error: No Android device connected or device not authorized."
  echo "Please connect a device or emulator and make sure USB debugging is enabled."
  exit 1
fi

# Function to handle errors
handle_error() {
  echo "Error: $1"
  echo "Script terminated."
  exit 1
}

echo "===== Zotik Android Screenshot Generator ====="
echo "Taking screenshots for Android..."
echo "Screenshots will be saved to: $SCREENSHOT_DIR"

# Function to take a screenshot
take_screenshot() {
  local screen_name=$1
  local file_name="${SCREENSHOT_DIR}/${screen_name}.png"
  
  echo "Taking screenshot of ${screen_name}..."
  adb shell screencap -p /sdcard/screen_temp.png
  adb pull /sdcard/screen_temp.png "$file_name"
  adb shell rm /sdcard/screen_temp.png
  
  echo "Screenshot saved to $file_name"
}

# Get device resolution to calculate tap positions if needed
RESOLUTION=$(adb shell wm size | awk '{print $3}')
WIDTH=$(echo $RESOLUTION | cut -d'x' -f1)
HEIGHT=$(echo $RESOLUTION | cut -d'x' -f2)
echo "Device resolution: $WIDTH x $HEIGHT"

# Navigate through app screens and take screenshots
# Replace these with your actual app navigation commands

# Launch app
echo "Launching app..."
adb shell am force-stop com.zotik
adb shell am start -n com.zotik/.MainActivity
sleep 5

# Login Screen
echo "Taking screenshot of login screen..."
take_screenshot "00_login_screen"

# Perform login with +2550112345678 as phone number and 000000 as verify code
echo "Performing login..."

# Based on the LoginScreen.tsx, the PhoneInput component is centered in the screen
# The phone input will be roughly at 40% of the screen height
PHONE_INPUT_Y=$(($HEIGHT * 40 / 100))

# For the phone input field, we need to tap on the text input part (right side of component)
# The PhoneInput has a country code selector on left and text field on right
# Target the right side of the screen center
PHONE_INPUT_X=$(($WIDTH * 65 / 100))

# Tap on phone field
echo "Tapping phone input field at $PHONE_INPUT_X, $PHONE_INPUT_Y"
adb shell input tap $PHONE_INPUT_X $PHONE_INPUT_Y
sleep 1

# Clear any existing text (long press to select all text and delete)
# Double tap to select word
adb shell input tap $PHONE_INPUT_X $PHONE_INPUT_Y
adb shell input tap $PHONE_INPUT_X $PHONE_INPUT_Y
# Long press to show edit menu
adb shell input swipe $PHONE_INPUT_X $PHONE_INPUT_Y $PHONE_INPUT_X $PHONE_INPUT_Y 1000
# Delete all text
adb shell input keyevent KEYCODE_DEL
sleep 1

# Enter phone number
echo "Entering phone number: +2550112345678"
adb shell input text "+2550112345678"
sleep 2

# The login button is below the phone input
# Based on styles, it's approximately 70-120px below the input
LOGIN_BUTTON_Y=$(($PHONE_INPUT_Y + 150))
LOGIN_BUTTON_X=$(($WIDTH / 2))  # Center of screen

# Tap login button
echo "Tapping login button at $LOGIN_BUTTON_X, $LOGIN_BUTTON_Y"
adb shell input tap $LOGIN_BUTTON_X $LOGIN_BUTTON_Y
sleep 5

# After sending verification code, the screen changes to show verification input
# The verification code field is centered and appears in the upper middle of screen
VERIFICATION_INPUT_Y=$(($HEIGHT * 35 / 100))
VERIFICATION_INPUT_X=$(($WIDTH / 2))  # Center of screen

# Tap on verification code field
echo "Tapping verification code field at $VERIFICATION_INPUT_X, $VERIFICATION_INPUT_Y"
adb shell input tap $VERIFICATION_INPUT_X $VERIFICATION_INPUT_Y
sleep 1

# Enter verification code
echo "Entering verification code: 000000"
adb shell input text "000000"
sleep 2

# The verify button is below the verification input
VERIFY_BUTTON_Y=$(($VERIFICATION_INPUT_Y + 150))
VERIFY_BUTTON_X=$(($WIDTH / 2))  # Center of screen

# Tap verify button
echo "Tapping verify button at $VERIFY_BUTTON_X, $VERIFY_BUTTON_Y"
adb shell input tap $VERIFY_BUTTON_X $VERIFY_BUTTON_Y
sleep 5

# Home Screen (after login)
echo "Navigating to Home Screen..."
take_screenshot "01_home_screen"

# Based on the Menu.tsx and HomeScreen.tsx, there are menu buttons arranged vertically
# Each button is inside a LinearGradient container with marginVertical of 8
# The buttons are displayed in a column layout

# Calculate button positions based on screen size
# We need to tap the center of each button
# The first button (Exercise) is at approximately 25% down from the top of the screen
# The spacing between buttons is about 10-15% of screen height

BUTTON_CENTER_X=$(($WIDTH / 2))
FIRST_BUTTON_Y=$(($HEIGHT * 25 / 100))
BUTTON_SPACING=$(($HEIGHT * 12 / 100))  # Approximate spacing between buttons

# Navigate to Exercise Screen (first button)
echo "Navigating to Exercise Screen..."
EXERCISE_BUTTON_Y=$FIRST_BUTTON_Y
echo "Tapping Exercise button at $BUTTON_CENTER_X, $EXERCISE_BUTTON_Y"
adb shell input tap $BUTTON_CENTER_X $EXERCISE_BUTTON_Y
sleep 3
take_screenshot "02_exercise_screen"

# Go back to Home screen
adb shell input keyevent KEYCODE_BACK
sleep 2

# Navigate to Diet Screen (second button)
echo "Navigating to Diet Screen..."
DIET_BUTTON_Y=$(($FIRST_BUTTON_Y + $BUTTON_SPACING))
echo "Tapping Diet button at $BUTTON_CENTER_X, $DIET_BUTTON_Y"
adb shell input tap $BUTTON_CENTER_X $DIET_BUTTON_Y
sleep 3
take_screenshot "03_diet_screen"

# Go back to Home screen
adb shell input keyevent KEYCODE_BACK
sleep 2

# Navigate to Weight Screen (third button)
echo "Navigating to Weight Screen..."
WEIGHT_BUTTON_Y=$(($FIRST_BUTTON_Y + ($BUTTON_SPACING * 2)))
echo "Tapping Weight button at $BUTTON_CENTER_X, $WEIGHT_BUTTON_Y"
adb shell input tap $BUTTON_CENTER_X $WEIGHT_BUTTON_Y
sleep 3
take_screenshot "04_weight_screen"

# Go back to Home screen
adb shell input keyevent KEYCODE_BACK
sleep 2

# Navigate to Supplements Screen (fourth button)
echo "Navigating to Supplements Screen..."
SUPPLEMENTS_BUTTON_Y=$(($FIRST_BUTTON_Y + ($BUTTON_SPACING * 3)))
echo "Tapping Supplements button at $BUTTON_CENTER_X, $SUPPLEMENTS_BUTTON_Y"
adb shell input tap $BUTTON_CENTER_X $SUPPLEMENTS_BUTTON_Y
sleep 3
take_screenshot "05_supplements_screen"

# Go back to Home screen
adb shell input keyevent KEYCODE_BACK
sleep 2

# Navigate to Profile Screen from the menu in the header
# The menu icon is typically in the top-right corner
echo "Navigating to Profile Screen..."
MENU_ICON_X=$(($WIDTH * 90 / 100))  # Approximately 90% from the left edge
MENU_ICON_Y=$(($HEIGHT * 5 / 100))  # Approximately 5% from the top

# Tap on the menu icon
echo "Tapping menu icon at $MENU_ICON_X, $MENU_ICON_Y"
adb shell input tap $MENU_ICON_X $MENU_ICON_Y
sleep 1

# The Profile option is usually the first item in the dropdown
PROFILE_OPTION_X=$(($WIDTH * 85 / 100))  # Slightly to the left of the menu icon
PROFILE_OPTION_Y=$(($HEIGHT * 10 / 100))  # Below the menu icon

# Tap on the Profile option
echo "Tapping Profile option at $PROFILE_OPTION_X, $PROFILE_OPTION_Y"
adb shell input tap $PROFILE_OPTION_X $PROFILE_OPTION_Y
sleep 3
take_screenshot "06_profile_screen"

# Return to home screen for a clean finish
adb shell input keyevent KEYCODE_HOME
sleep 1

echo "===== Screenshot Generation Complete ====="
echo "All screenshots have been captured and saved to $SCREENSHOT_DIR"
echo "Total screenshots taken: 7"
echo ""
echo "Note: You may need to adjust tap coordinates based on your specific device's resolution."
echo "If login fails or navigation doesn't work correctly, try modifying the coordinates in this script."

# List all captured screenshots
echo ""
echo "Screenshots captured:"
ls -1 "$SCREENSHOT_DIR" | grep -E "\.png$"