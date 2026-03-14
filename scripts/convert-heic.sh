#!/bin/bash
# Convert any .heic/.HEIC files in public/images to .jpg
# This runs on macOS (sips) or can be skipped in CI

IMAGES_DIR="$(dirname "$0")/../public/images"

if ! command -v sips &> /dev/null; then
  echo "sips not available (not macOS), skipping HEIC conversion"
  exit 0
fi

find "$IMAGES_DIR" -iname "*.heic" | while read -r heic_file; do
  jpg_file="${heic_file%.*}.jpg"
  if [ ! -f "$jpg_file" ]; then
    echo "Converting: $heic_file -> $jpg_file"
    sips -s format jpeg --resampleWidth 1200 -s formatOptions 80 "$heic_file" --out "$jpg_file" 2>/dev/null
  fi
done

echo "HEIC conversion complete"
