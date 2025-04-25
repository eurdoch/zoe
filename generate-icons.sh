#!/bin/bash

# Script to generate app icons for iOS and Android from an input image
# Usage: ./generate-icons.sh

# Source image
SOURCE_IMAGE="david_padded.jpg"

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it first:"
    echo "  brew install imagemagick  # macOS"
    echo "  apt-get install imagemagick  # Ubuntu/Debian"
    exit 1
fi

# iOS icon sizes and paths
echo "Generating iOS icons..."
IOS_ICON_DIR="ios/zotik/Images.xcassets/AppIcon.appiconset"
mkdir -p "$IOS_ICON_DIR"

# Generate iOS icons
magick "$SOURCE_IMAGE" -resize 40x40 -background none -gravity center -extent 40x40 "$IOS_ICON_DIR/iPhone-Notification-20pt@2x.png"
magick "$SOURCE_IMAGE" -resize 60x60 -background none -gravity center -extent 60x60 "$IOS_ICON_DIR/iPhone-Notification-20pt@3x.png"
magick "$SOURCE_IMAGE" -resize 58x58 -background none -gravity center -extent 58x58 "$IOS_ICON_DIR/iPhone-Settings-29pt@2x.png"
magick "$SOURCE_IMAGE" -resize 87x87 -background none -gravity center -extent 87x87 "$IOS_ICON_DIR/iPhone-Settings-29pt@3x.png"
magick "$SOURCE_IMAGE" -resize 80x80 -background none -gravity center -extent 80x80 "$IOS_ICON_DIR/iPhone-Spotlight-40pt@2x.png"
magick "$SOURCE_IMAGE" -resize 120x120 -background none -gravity center -extent 120x120 "$IOS_ICON_DIR/iPhone-Spotlight-40pt@3x.png"
magick "$SOURCE_IMAGE" -resize 120x120 -background none -gravity center -extent 120x120 "$IOS_ICON_DIR/iPhone-App-60pt@2x.png"
magick "$SOURCE_IMAGE" -resize 180x180 -background none -gravity center -extent 180x180 "$IOS_ICON_DIR/iPhone-App-60pt@3x.png"
magick "$SOURCE_IMAGE" -resize 1024x1024 -background none -gravity center -extent 1024x1024 "$IOS_ICON_DIR/AppStore-1024pt@1x.png"

echo "iOS icons generated in $IOS_ICON_DIR"

# Android icon sizes and paths
echo "Generating Android icons..."
ANDROID_RES_DIR="android/app/src/main/res"

# Create directories if they don't exist
ANDROID_MIPMAP_DIRS=("mipmap-mdpi" "mipmap-hdpi" "mipmap-xhdpi" "mipmap-xxhdpi" "mipmap-xxxhdpi")
ANDROID_SIZES=(48 72 96 144 192)

for i in "${!ANDROID_MIPMAP_DIRS[@]}"; do
    DIR="${ANDROID_RES_DIR}/${ANDROID_MIPMAP_DIRS[$i]}"
    SIZE="${ANDROID_SIZES[$i]}"
    mkdir -p "$DIR"
    
    # Regular icon
    magick "$SOURCE_IMAGE" -resize ${SIZE}x${SIZE} -background none -gravity center -extent ${SIZE}x${SIZE} "$DIR/ic_launcher.png"
    
    # Round icon (with circle mask)
    magick "$SOURCE_IMAGE" -resize ${SIZE}x${SIZE} -background none -gravity center -extent ${SIZE}x${SIZE} \
        \( +clone -alpha extract -draw "fill black circle ${SIZE},${SIZE} ${SIZE},0" -alpha off \) \
        -compose CopyOpacity -composite "$DIR/ic_launcher_round.png"
    
    # Foreground layer for adaptive icons
    INNER_SIZE=$(( SIZE * 3/4 ))
    magick "$SOURCE_IMAGE" -resize ${INNER_SIZE}x${INNER_SIZE} -background none -gravity center -extent ${SIZE}x${SIZE} "$DIR/ic_launcher_foreground.png"
    
    echo "Generated icons in $DIR"
done

echo "All app icons have been generated successfully!"