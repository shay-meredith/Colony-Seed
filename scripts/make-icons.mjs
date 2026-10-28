// Generates placeholder PWA icons (PNG) with no external dependencies.
// Run with `npm run icons`; output is committed under public/icons/.
// Artwork stays inside the central 80% so the same files are maskable-safe.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const COLORS = {
  bgTop: [26, 31, 33],
  bgBottom: [14, 17, 18],
  plate: [74, 85, 48],
  plateEdge: [104, 117, 72],
  ring: [217, 164, 65],
  core: [230, 226, 211],
};

const SUPERSAMPLE = 4;

function sample(x, y) {
  const t = (y + 1) / 2;
  let c = COLORS.bgTop.map((v, i) => v + (COLORS.bgBottom[i] - v) * t);

  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const inPlate = ax < 0.66 && ay < 0.66 && ax + ay < 1.05;
  const inPlateInner = ax < 0.61 && ay < 0.61 && ax + ay < 0.98;
  if (inPlate) c = inPlateInner ? COLORS.plate : COLORS.plateEdge;

  const r = Math.hypot(x, y);
  if (r > 0.37 && r < 0.42) c = COLORS.ring;
  if (r < 0.15) c = COLORS.core;

  const a = -Math.PI / 4;
  const px = 0.395 * Math.cos(a);
  const py = 0.395 * Math.sin(a);
  const pr = Math.hypot(x - px, y - py);
  if (pr < 0.11) c = COLORS.plate;
  if (pr < 0.085) c = COLORS.ring;

  return c;
}

function render(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const n = SUPERSAMPLE * SUPERSAMPLE;
  for (let py = 0; py < size; py++) {
    const row = py * (size * 4 + 1);
    raw[row] = 0;
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const x = ((px + (sx + 0.5) / SUPERSAMPLE) / size) * 2 - 1;
          const y = ((py + (sy + 0.5) / SUPERSAMPLE) / size) * 2 - 1;
          const c = sample(x, y);
          acc[0] += c[0];
          acc[1] += c[1];
          acc[2] += c[2];
        }
      }
      const o = row + 1 + px * 4;
      raw[o] = Math.round(acc[0] / n);
      raw[o + 1] = Math.round(acc[1] / n);
      raw[o + 2] = Math.round(acc[2] / n);
      raw[o + 3] = 255;
    }
  }
  return encodePng(size, size, raw);
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(join(OUT_DIR, name), render(size));
  console.log(`wrote public/icons/${name}`);
}
