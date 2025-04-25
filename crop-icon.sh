#!/bin/bash

# Script to crop and prepare square icon from david.jpg
# Usage: ./crop-icon.sh

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it first:"
    echo "  brew install imagemagick  # macOS"
    echo "  apt-get install imagemagick  # Ubuntu/Debian"
    exit 1
fi

# Original image
SOURCE_IMAGE="david.jpg"
# Temporary square cropped image
CROPPED_IMAGE="david_square.jpg"

# Get image dimensions
WIDTH=$(magick identify -format "%w" "$SOURCE_IMAGE")
HEIGHT=$(magick identify -format "%h" "$SOURCE_IMAGE")

echo "Original image: ${WIDTH}x${HEIGHT}"

# Crop to square from the top (to focus on the head/face)
CROP_SIZE=$WIDTH
if [ $WIDTH -gt $HEIGHT ]; then
    CROP_SIZE=$HEIGHT
fi

# Create a square cropped image with padding
echo "Cropping to square ${CROP_SIZE}x${CROP_SIZE}..."
magick "$SOURCE_IMAGE" -gravity north -crop ${CROP_SIZE}x${CROP_SIZE}+0+0 +repage "$CROPPED_IMAGE"

# Now add padding to ensure no white edges
echo "Adding padding for icons..."
magick "$CROPPED_IMAGE" -resize 90% -background none -gravity center -extent 100%x100% "david_padded.jpg"

# Run the icon generator with the new image
sed -i.bak "s/SOURCE_IMAGE=\"david.jpg\"/SOURCE_IMAGE=\"david_padded.jpg\"/" generate-icons.sh

echo "Updated generate-icons.sh to use the cropped and padded image."
echo "Run ./generate-icons.sh to regenerate the app icons."