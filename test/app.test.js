/**
 * Ocean Literacy Desktop Application - Test Suite
 * Validates data schemas, assets, desktop entry points, and script integrity.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('Running Ocean Literacy Test Suite...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ ${name}: ${err.message}`);
    }
  }

  // 1. Check Package Configuration
  test('package.json exists and defines electron main', () => {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    assert(fs.existsSync(pkgPath), 'package.json missing');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.strictEqual(pkg.main, 'src/main/main.js');
    assert(pkg.scripts.start, 'npm start missing');
    assert(pkg.scripts.dist, 'npm run dist missing');
  });

  // 2. Check Core Electron Entrypoints
  test('Electron main process and preload scripts exist', () => {
    const mainPath = path.join(__dirname, '..', 'src/main/main.js');
    const preloadPath = path.join(__dirname, '..', 'src/preload/preload.js');
    const indexPath = path.join(__dirname, '..', 'src/renderer/index.html');
    assert(fs.existsSync(mainPath), 'main.js missing');
    assert(fs.existsSync(preloadPath), 'preload.js missing');
    assert(fs.existsSync(indexPath), 'index.html missing');
  });

  // 3. Check 7 UNESCO Principles Data
  test('Principles dataset contains all 7 UNESCO principles', () => {
    const dataPath = path.join(__dirname, '..', 'src/renderer/js/data/principles.js');
    assert(fs.existsSync(dataPath), 'principles.js missing');
    const content = fs.readFileSync(dataPath, 'utf8');
    const window = {};
    eval(content); // safely evaluate data assignment to window.OCEAN_PRINCIPLES
    assert(Array.isArray(window.OCEAN_PRINCIPLES), 'OCEAN_PRINCIPLES is not an array');
    assert.strictEqual(window.OCEAN_PRINCIPLES.length, 7, 'Must have exactly 7 principles');
    window.OCEAN_PRINCIPLES.forEach((p, idx) => {
      assert.strictEqual(p.number, idx + 1, `Principle number mismatch at ${idx}`);
      assert(p.title && p.title.length > 5, `Principle ${idx + 1} missing title`);
      assert(Array.isArray(p.concepts) && p.concepts.length > 0, `Principle ${idx + 1} missing concepts`);
      assert(p.caseStudy && p.caseStudy.title, `Principle ${idx + 1} missing case study`);
    });
  });

  // 4. Check Depth Zones Data
  test('Depth Zones dataset contains 5 bathymetric layers', () => {
    const depthPath = path.join(__dirname, '..', 'src/renderer/js/data/depthZones.js');
    assert(fs.existsSync(depthPath), 'depthZones.js missing');
    const content = fs.readFileSync(depthPath, 'utf8');
    const window = {};
    eval(content);
    assert(Array.isArray(window.OCEAN_DEPTH_ZONES), 'OCEAN_DEPTH_ZONES is not an array');
    assert.strictEqual(window.OCEAN_DEPTH_ZONES.length, 5, 'Must have 5 vertical depth zones');
  });

  // 5. Check Marine Species Dataset
  test('Marine Life dataset contains valid species records', () => {
    const marinePath = path.join(__dirname, '..', 'src/renderer/js/data/marineLife.js');
    assert(fs.existsSync(marinePath), 'marineLife.js missing');
    const content = fs.readFileSync(marinePath, 'utf8');
    const window = {};
    eval(content);
    assert(Array.isArray(window.MARINE_SPECIES), 'MARINE_SPECIES is not an array');
    assert(window.MARINE_SPECIES.length >= 10, 'Expected at least 10 marine species');
    window.MARINE_SPECIES.forEach(s => {
      assert(s.commonName && s.scientificName, 'Species missing name');
      assert(['CR', 'EN', 'VU', 'NT', 'LC', 'NE'].includes(s.iucnCode), `Invalid IUCN code ${s.iucnCode}`);
    });
  });

  // 6. Check Asset Icons
  test('App branding and tray icon PNGs exist and have non-zero size', () => {
    const iconPath = path.join(__dirname, '..', 'assets/icons/icon.png');
    const trayPath = path.join(__dirname, '..', 'assets/icons/tray-icon.png');
    assert(fs.existsSync(iconPath), 'icon.png missing');
    assert(fs.existsSync(trayPath), 'tray-icon.png missing');
    assert(fs.statSync(iconPath).size > 1000, 'icon.png too small');
    assert(fs.statSync(trayPath).size > 100, 'tray-icon.png too small');
  });

  console.log(`\nResults: ${passed} / ${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
