#!/usr/bin/env node
/**
 * Quick environment and configuration verification tool
 */

const { execSync } = require('child_process');

console.log('Validating desktop environment and project files...');
try {
  execSync('node test/app.test.js', { stdio: 'inherit' });
  console.log('\n✨ Everything is properly configured and ready for desktop compilation!');
} catch (err) {
  console.error('\n❌ Verification encountered an error.');
  process.exit(1);
}
