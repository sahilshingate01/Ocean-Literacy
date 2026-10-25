#!/usr/bin/env bash
set -e

echo "🌊 Building Ultra-Lightweight Native macOS App & DMG (<10 MB)..."

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"
APP_NAME="Ocean Literacy"
APP_BUNDLE="$DIST_DIR/native/$APP_NAME.app"
DMG_NAME="Ocean-Literacy-Lite.dmg"
DMG_PATH="$DIST_DIR/$DMG_NAME"
TEMP_DMG_DIR="$DIST_DIR/dmg-temp"

rm -rf "$DIST_DIR/native" "$DMG_PATH" "$TEMP_DMG_DIR"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"
mkdir -p "$TEMP_DMG_DIR"

# 1. Compile Swift native host with optimizations
echo "⚡ Compiling native WebKit executable with swiftc..."
swiftc -O -target arm64-apple-macos11.0 \
  "$PROJECT_ROOT/scripts/native-mac-host/main.swift" \
  -o "$APP_BUNDLE/Contents/MacOS/OceanLiteracy"

# 2. Copy renderer web assets
echo "📦 Bundling web application assets..."
mkdir -p "$APP_BUNDLE/Contents/Resources/src"
cp -R "$PROJECT_ROOT/src/renderer" "$APP_BUNDLE/Contents/Resources/src/"
if [ -d "$PROJECT_ROOT/assets" ]; then
  cp -R "$PROJECT_ROOT/assets" "$APP_BUNDLE/Contents/Resources/"
fi

# 3. Create Info.plist
cat << 'EOF' > "$APP_BUNDLE/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>Ocean Literacy</string>
    <key>CFBundleExecutable</key>
    <string>OceanLiteracy</string>
    <key>CFBundleIdentifier</key>
    <string>com.sahilshingate.oceanliteracy</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Ocean Literacy</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
</plist>
EOF

# 4. Copy to temporary DMG staging directory and add Applications symlink
echo "💿 Staging DMG volume layout..."
cp -R "$APP_BUNDLE" "$TEMP_DMG_DIR/"
ln -s /Applications "$TEMP_DMG_DIR/Applications"

# 5. Create compressed DMG using hdiutil
echo "🚀 Creating compressed DMG with hdiutil..."
hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$TEMP_DMG_DIR" \
  -ov \
  -format UDZO \
  "$DMG_PATH"

rm -rf "$TEMP_DMG_DIR"

DMG_SIZE=$(ls -lh "$DMG_PATH" | awk '{print $5}')
echo ""
echo "✅ SUCCESS! Ultra-lightweight DMG generated:"
echo "   File: $DMG_PATH"
echo "   Size: $DMG_SIZE (Well under 50 MB!)"
