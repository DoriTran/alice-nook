/**
 * One-time helper: alpha-crop padded auth text/logo PNGs in place.
 * Uses only Node builtins (fs, zlib, crypto).
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const TARGETS = [
  'src/assets/v2/decoration/text/alice-nook_auth-logo.png',
  'src/assets/v2/decoration/text/alice-nook_slogan.png',
  'src/assets/v2/decoration/text/alice-nook_divider.png',
  'src/assets/v2/decoration/text/alice-nook_help-text.png',
  'src/assets/v2/decoration/text/panel_divider.png',
];

const ALPHA_THRESHOLD = 10;
/** Breathing room as a fraction of the shorter side of the content box. */
const MARGIN_RATIO = 0.04;

function crc32Manual(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  const out = Buffer.alloc(4);
  out.writeUInt32BE((c ^ 0xffffffff) >>> 0);
  return out;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = crc32Manual(Buffer.concat([typeBuf, data]));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function readPng(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw new Error(`Not a PNG: ${filePath}`);
  }

  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  const idatChunks = [];
  let trns = null;

  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'tRNS') {
      trns = data;
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + len;
  }

  if (bitDepth !== 8) {
    throw new Error(`Only 8-bit PNGs supported: ${filePath} (bitDepth=${bitDepth})`);
  }

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`Unsupported colorType ${colorType}`);

  const bpp = channels;
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const out = Buffer.alloc(stride * height);
  let pos = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[pos];
    pos += 1;
    const rowStart = y * stride;
    const prevRowStart = (y - 1) * stride;

    for (let x = 0; x < stride; x++) {
      const rawX = raw[pos + x];
      const a = x >= bpp ? out[rowStart + x - bpp] : 0;
      const b = y > 0 ? out[prevRowStart + x] : 0;
      const c = y > 0 && x >= bpp ? out[prevRowStart + x - bpp] : 0;
      let val;
      if (filter === 0) val = rawX;
      else if (filter === 1) val = rawX + a;
      else if (filter === 2) val = rawX + b;
      else if (filter === 3) val = rawX + Math.floor((a + b) / 2);
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        val = rawX + pr;
      } else {
        throw new Error(`Unknown filter ${filter}`);
      }
      out[rowStart + x] = val & 0xff;
    }
    pos += stride;
  }

  // Normalize to RGBA
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const src = i * channels;
    const dst = i * 4;
    if (colorType === 6) {
      rgba[dst] = out[src];
      rgba[dst + 1] = out[src + 1];
      rgba[dst + 2] = out[src + 2];
      rgba[dst + 3] = out[src + 3];
    } else if (colorType === 2) {
      rgba[dst] = out[src];
      rgba[dst + 1] = out[src + 1];
      rgba[dst + 2] = out[src + 2];
      rgba[dst + 3] = 255;
    } else if (colorType === 4) {
      rgba[dst] = out[src];
      rgba[dst + 1] = out[src];
      rgba[dst + 2] = out[src];
      rgba[dst + 3] = out[src + 1];
    } else if (colorType === 0) {
      rgba[dst] = out[src];
      rgba[dst + 1] = out[src];
      rgba[dst + 2] = out[src];
      rgba[dst + 3] = 255;
    } else if (colorType === 3) {
      // Indexed — shouldn't appear for these assets, but handle grayscale fallback
      const pi = out[src];
      rgba[dst] = pi;
      rgba[dst + 1] = pi;
      rgba[dst + 2] = pi;
      rgba[dst + 3] = trns && pi < trns.length ? trns[pi] : 255;
    }
  }

  return { width, height, rgba };
}

function contentBBox(rgba, width, height, threshold) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = rgba[(y * width + x) * 4 + 3];
      if (a > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) throw new Error('Image is fully transparent');
  return { minX, minY, maxX, maxY };
}

function cropRgba(rgba, width, height, box) {
  const { minX, minY, maxX, maxY } = box;
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const srcStart = ((minY + y) * width + minX) * 4;
    rgba.copy(out, y * w * 4, srcStart, srcStart + w * 4);
  }
  return { width: w, height: h, rgba: out };
}

function encodePngRgba(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter None
    rgba.copy(raw, rowStart + 1, y * stride, y * stride + stride);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function cropFile(relPath) {
  const abs = path.join(root, relPath);
  const img = readPng(abs);
  const box = contentBBox(img.rgba, img.width, img.height, ALPHA_THRESHOLD);

  const contentW = box.maxX - box.minX + 1;
  const contentH = box.maxY - box.minY + 1;
  const margin = Math.max(2, Math.round(Math.min(contentW, contentH) * MARGIN_RATIO));

  const padded = {
    minX: Math.max(0, box.minX - margin),
    minY: Math.max(0, box.minY - margin),
    maxX: Math.min(img.width - 1, box.maxX + margin),
    maxY: Math.min(img.height - 1, box.maxY + margin),
  };

  const cropped = cropRgba(img.rgba, img.width, img.height, padded);
  const encoded = encodePngRgba(cropped.width, cropped.height, cropped.rgba);
  fs.writeFileSync(abs, encoded);

  console.log(
    `${relPath}: ${img.width}x${img.height} → ${cropped.width}x${cropped.height} (margin ${margin}px)`,
  );
}

for (const rel of TARGETS) {
  cropFile(rel);
}

console.log('Done.');
