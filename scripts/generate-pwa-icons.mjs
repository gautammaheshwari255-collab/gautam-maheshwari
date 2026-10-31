import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Minimal pure Node.js PNG encoder without external native dependencies
function createPNG(width, height, drawFn) {
  // RGBA buffer with 1 extra filter byte per scanline
  const scanlineSize = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const length = data.length;
    const buf = Buffer.alloc(12 + length);
    buf.writeUInt32BE(length, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const typeAndData = buf.subarray(4, 8 + length);
    const crc = crc32(typeAndData);
    buf.writeUInt32BE(crc, 8 + length);
    return buf;
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing function for OG AI Icon
function drawOGIcon(x, y, width, height, isMaskable = false) {
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxR = width / 2;

  // Background gradient: Deep space navy to rich dark slate
  const bgGrad = (y / height);
  let r = Math.round(11 + 6 * (1 - bgGrad));
  let g = Math.round(15 + 10 * (1 - bgGrad));
  let b = Math.round(25 + 25 * (1 - bgGrad));
  let a = 255;

  // Maskable keeps padding safe (essential elements within 80% circle)
  const scale = isMaskable ? 0.72 : 0.88;
  const scaledDist = dist / scale;
  const scaledR = maxR;

  // Outer orbital rings
  const ring1Dist = Math.abs(scaledDist - scaledR * 0.82);
  if (ring1Dist < (width > 200 ? 3 : 1.5)) {
    // Amber orbital ring
    const blend = 1 - (ring1Dist / 3);
    r = Math.min(255, Math.round(r + 245 * blend * 0.6));
    g = Math.min(255, Math.round(g + 158 * blend * 0.6));
    b = Math.min(255, Math.round(b + 11 * blend * 0.3));
  }

  const ring2Dist = Math.abs(scaledDist - scaledR * 0.68);
  if (ring2Dist < (width > 200 ? 3 : 1.5)) {
    // Cyan orbital ring
    const blend = 1 - (ring2Dist / 3);
    r = Math.min(255, Math.round(r + 56 * blend * 0.7));
    g = Math.min(255, Math.round(g + 189 * blend * 0.7));
    b = Math.min(255, Math.round(b + 248 * blend * 0.7));
  }

  // Golden 4-point / 8-point futuristic star in the center
  const angle = Math.atan2(dy, dx);
  const cos4 = Math.abs(Math.cos(angle * 2));
  const starShapeR = scaledR * (0.22 + 0.32 * Math.pow(cos4, 4));
  
  if (scaledDist < starShapeR) {
    const starRatio = 1 - (scaledDist / starShapeR);
    // Gradient from amber-gold to vivid sun yellow
    r = Math.min(255, Math.round(253 * (0.8 + 0.2 * starRatio)));
    g = Math.min(255, Math.round(186 * (0.7 + 0.3 * starRatio)));
    b = Math.min(255, Math.round(40 * (0.4 + 0.6 * starRatio)));
  }

  // Cyan Quantum Core
  const coreR = scaledR * 0.16;
  if (scaledDist < coreR) {
    const coreRatio = 1 - (scaledDist / coreR);
    r = Math.round(6 + (255 - 6) * Math.pow(coreRatio, 2));
    g = Math.round(182 + (255 - 182) * Math.pow(coreRatio, 1.5));
    b = Math.round(212 + (255 - 212) * coreRatio);
  }

  // Core brilliant center sparkle
  if (scaledDist < scaledR * 0.05) {
    r = 255;
    g = 255;
    b = 255;
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA compliant icons...');

// 1. 192x192
const pwa192 = createPNG(192, 192, (x, y, w, h) => drawOGIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
fs.writeFileSync(path.join(publicDir, 'ogoo-icon-192.png'), pwa192);

// 2. 512x512
const pwa512 = createPNG(512, 512, (x, y, w, h) => drawOGIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
fs.writeFileSync(path.join(publicDir, 'ogoo-icon-512.png'), pwa512);

// 3. 512x512 maskable (with safe zone)
const pwaMaskable = createPNG(512, 512, (x, y, w, h) => drawOGIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);
fs.writeFileSync(path.join(publicDir, 'ogoo-icon-maskable-512.png'), pwaMaskable);

// 4. 180x180 apple-touch-icon
const appleTouch = createPNG(180, 180, (x, y, w, h) => drawOGIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

console.log('Successfully generated all PWA PNG icons!');
