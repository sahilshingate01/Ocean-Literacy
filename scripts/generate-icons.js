#!/usr/bin/env node
/**
 * Ocean Literacy Desktop Asset Generator
 * Generates valid PNG icons without external runtime dependencies using Node's zlib module.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, toCrc, crcBuf]);
}

function generateOceanPNG(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bitDepth=8, colorType=6 (RGBA), compression=0, filter=0, interlace=0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw pixel data with filter byte (0) per row
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (rowBytes + 1));

  const cx = width / 2;
  const cy = height / 2;
  const maxR = width * 0.45;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Squircle app icon mask
      const normX = Math.abs(x - cx) / (width * 0.48);
      const normY = Math.abs(y - cy) / (height * 0.48);
      const squircle = Math.pow(normX, 4) + Math.pow(normY, 4);

      if (squircle > 1.0) {
        // Transparent outside icon squircle
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
      } else {
        // Ocean gradient from deep navy to vibrant cyan
        const tY = y / height;
        const wave = Math.sin((x / width) * 4 * Math.PI + (y / height) * 2) * 15;
        const inWave = (y + wave) > (cy * 0.9);

        let r = Math.floor(4 + tY * 15);
        let g = Math.floor(18 + tY * 60);
        let b = Math.floor(45 + tY * 110);
        let a = 255;

        // Wave crest highlights
        if (inWave) {
          const depthFactor = (y - (cy * 0.9)) / (height * 0.55);
          r = Math.floor(0 + (1 - depthFactor) * 20);
          g = Math.floor(180 + (1 - depthFactor) * 62);
          b = Math.floor(220 + (1 - depthFactor) * 35);
        }

        // Center pearl / compass dot
        if (dist < width * 0.08) {
          const core = 1 - (dist / (width * 0.08));
          r = Math.min(255, Math.floor(r + core * 240));
          g = Math.min(255, Math.floor(g + core * 240));
          b = Math.min(255, Math.floor(b + core * 255));
        }

        // Bioluminescent ring
        const ringDist = Math.abs(dist - maxR * 0.85);
        if (ringDist < 3.5) {
          r = Math.min(255, r + 40);
          g = Math.min(255, g + 190);
          b = Math.min(255, b + 240);
        }

        rawData[offset++] = r;
        rawData[offset++] = g;
        rawData[offset++] = b;
        rawData[offset++] = a;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function main() {
  const iconDir = path.join(__dirname, '..', 'assets', 'icons');
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  // 1. Generate 512x512 Main Application Icon
  const mainIconPath = path.join(iconDir, 'icon.png');
  const mainIconBuf = generateOceanPNG(512, 512);
  fs.writeFileSync(mainIconPath, mainIconBuf);
  console.log(`Generated main app icon: ${mainIconPath} (${mainIconBuf.length} bytes)`);

  // 2. Generate 32x32 Tray Icon
  const trayIconPath = path.join(iconDir, 'tray-icon.png');
  const trayIconBuf = generateOceanPNG(32, 32);
  fs.writeFileSync(trayIconPath, trayIconBuf);
  console.log(`Generated system tray icon: ${trayIconPath} (${trayIconBuf.length} bytes)`);
}

main();
