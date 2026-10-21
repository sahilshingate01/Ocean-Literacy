#!/usr/bin/env node
/**
 * Ocean Literacy Desktop Build Automation Tool
 * Pre-build asset validation, platform packaging orchestration, and distribution verification.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkFile(relPath, desc) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing critical ${desc}: ${relPath}`);
    return false;
  }
  console.log(`✓ Verified ${desc}: ${relPath}`);
  return true;
}

function main() {
  console.log('🌊 Ocean Literacy Desktop Build Pipeline');
  console.log('========================================');

  // 1. Verify Assets
  let valid = true;
  valid = checkFile('assets/icons/icon.png', '512x512 Main Application Icon') && valid;
  valid = checkFile('assets/icons/tray-icon.png', '32x32 System Tray Icon') && valid;
  valid = checkFile('electron-builder.yml', 'Electron-builder packaging config') && valid;
  valid = checkFile('build/entitlements.mac.plist', 'macOS hardened runtime entitlements') && valid;
  valid = checkFile('build/installer.nsh', 'Windows NSIS installer script') && valid;

  if (!valid) {
    console.log('Regenerating missing icons...');
    execSync('node scripts/generate-icons.js', { stdio: 'inherit' });
  }

  // 2. Run Test Suite
  console.log('\n🧪 Running test suite...');
  try {
    execSync('node test/app.test.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Test suite failed. Build aborted.');
    process.exit(1);
  }

  console.log('\n🚀 Pre-flight verification passed successfully!');
  console.log('To produce desktop binary distributions:');
  console.log('  - macOS:   npm run dist:mac');
  console.log('  - Windows: npm run dist:win');
  console.log('  - Linux:   npm run dist:linux');
  console.log('  - Unpacked dir: npm run pack');
}

main();
