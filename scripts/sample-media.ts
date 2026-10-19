import { createHash } from "node:crypto";
import { zlibSync } from "fflate";

/** Pictures and recordings for the sample library, generated from code so the repository holds no binary files. */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** The first bytes of a text's hash: stable, and different texts get different values. */
export function seedOf(text: string): Uint8Array {
  return createHash("sha256").update(text).digest();
}

/** A 48x48 picture: a background colour and a lighter square, both taken from the text, so every word has its own picture. */
export function makePng(text: string): Uint8Array {
  const seed = seedOf(text);
  const size = 48;
  const bg = [seed[0]! % 200, seed[1]! % 200, seed[2]! % 200];
  const fg = [Math.min(255, bg[0]! + 55), Math.min(255, bg[1]! + 55), Math.min(255, bg[2]! + 55)];
  const lo = 8 + (seed[3]! % 8);
  const hi = size - lo;
  const raw = new Uint8Array(size * (1 + size * 3));
  for (let y = 0; y < size; y += 1) {
    const row = y * (1 + size * 3);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const color = x >= lo && x < hi && y >= lo && y < hi ? fg : bg;
      raw.set(color as number[], row + 1 + x * 3);
    }
  }
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, size);
  view.setUint32(4, size);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  const signature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const parts = [signature, chunk("IHDR", header), chunk("IDAT", zlibSync(raw)), chunk("IEND", new Uint8Array(0))];
  const png = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    png.set(p, offset);
    offset += p.length;
  }
  return png;
}

/** A short 8 kHz mono WAV tone whose pitch is taken from the text. Silent enough to run in tests, valid for the app's checks. */
export function makeWav(text: string): Uint8Array {
  const seed = seedOf(text);
  const rate = 8000;
  const samples = Math.floor(rate * 0.25);
  const frequency = 220 + (seed[4]! % 40) * 15 + (seed[5]! % 4);
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, s: string) => [...s].forEach((c, i) => (bytes[offset + i] = c.charCodeAt(0)));
  ascii(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i += 1) {
    const envelope = Math.min(1, i / 200, (samples - i) / 200);
    view.setInt16(44 + i * 2, Math.round(Math.sin((2 * Math.PI * frequency * i) / rate) * 6000 * envelope), true);
  }
  return bytes;
}

export const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
