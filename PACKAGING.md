# Desktop Packaging & Distribution Guide

Ocean Literacy uses **Electron-Builder** to bundle and distribute multi-platform installers.

---

## Output Target Matrix

| OS | Format | Architecture | Configured File |
| :--- | :--- | :--- | :--- |
| **macOS** | `.dmg` | `arm64`, `x64` | `dist/*.dmg` |
| **macOS** | `.zip` | `arm64`, `x64` | `dist/*.zip` |
| **Windows** | NSIS Installer (`.exe`) | `x64` | `dist/* Setup *.exe` |
| **Windows** | Portable (`.exe`) | `x64` | `dist/*.exe` |
| **Linux** | AppImage (`.AppImage`)| `x64` | `dist/*.AppImage` |
| **Linux** | Debian (`.deb`) | `x64` | `dist/*.deb` |

---

## Configuration Reference (`electron-builder.yml`)

1. **macOS Hardened Runtime:**
   Configured in `build/entitlements.mac.plist` to comply with Apple Notarization and Gatekeeper requirements.
   Allows JIT, unsigned executable memory for V8, and secure file download dialogues.

2. **Windows NSIS Installer Customization:**
   Configured in `build/installer.nsh` to register the custom URI protocol handler `ocean-literacy://` and create clean desktop shortcuts.

3. **Pre-build Check:**
   Always run before releasing:
   ```bash
   node scripts/build-desktop.js
   ```

---

## Release Commands

- Build macOS arm64 (Apple Silicon): `npm run dist:mac-arm`
- Build macOS x64 (Intel): `npm run dist:mac-intel`
- Build Windows installer: `npm run dist:win`
- Build Linux packages: `npm run dist:linux`
- Build all platforms (requires cross-toolchains): `npm run dist:all`
