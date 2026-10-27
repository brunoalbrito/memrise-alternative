#!/bin/bash
set -e

echo "Building MemBetter Release..."

# 1. TypeScript compilation
echo "→ Compiling TypeScript..."
pnpm run build

# 2. Build app bundle manually (skip electron-builder's problematic signing)
echo "→ Packaging Electron app..."
rm -rf release
pnpm exec electron-builder --dir --publish=never

# 3. Create DMG from app bundle
echo "→ Creating DMG..."
APP_PATH="release/mac-arm64/MemBetter.app"
if [ ! -d "$APP_PATH" ]; then
  echo "ERROR: App bundle not found at $APP_PATH"
  exit 1
fi

VERSION="${1:-unsigned}"
hdiutil create \
  -volname "MemBetter" \
  -srcfolder "$APP_PATH" \
  -ov -format UDZO \
  "release/MemBetter-${VERSION}-arm64.dmg"

echo "✓ Release built: release/MemBetter-${VERSION}-arm64.dmg"
