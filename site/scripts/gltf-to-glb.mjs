import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('uso: node gltf-to-glb.mjs <entrada.gltf> <saida.glb>');
  process.exit(1);
}

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const pad = (buffer, filler) => {
  const remainder = buffer.length % 4;
  if (remainder === 0) return buffer;
  return Buffer.concat([buffer, Buffer.alloc(4 - remainder, filler)]);
};

const gltf = JSON.parse(readFileSync(input, 'utf8'));
const baseDir = dirname(resolve(input));

const binaries = (gltf.buffers ?? []).map((buffer) => {
  if (!buffer.uri) throw new Error('buffer já embutido: nada a empacotar');
  if (buffer.uri.startsWith('data:')) return Buffer.from(buffer.uri.split(',')[1], 'base64');
  return readFileSync(resolve(baseDir, decodeURIComponent(buffer.uri)));
});

// GLB permite um único buffer binário: concatena mantendo alinhamento de 4 bytes
// e reescreve os offsets das bufferViews para o buffer unificado.
const offsets = [];
let total = 0;
for (const binary of binaries) {
  offsets.push(total);
  total += pad(binary, 0).length;
}

for (const view of gltf.bufferViews ?? []) {
  view.byteOffset = (view.byteOffset ?? 0) + offsets[view.buffer ?? 0];
  view.buffer = 0;
}

const bin = Buffer.concat(binaries.map((binary) => pad(binary, 0)));
gltf.buffers = [{ byteLength: bin.length }];

const jsonChunk = pad(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);
const binChunk = pad(bin, 0);

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

const chunkHeader = (length, type) => {
  const head = Buffer.alloc(8);
  head.writeUInt32LE(length, 0);
  head.writeUInt32LE(type, 4);
  return head;
};

const glb = Buffer.concat([
  header,
  chunkHeader(jsonChunk.length, JSON_CHUNK),
  jsonChunk,
  chunkHeader(binChunk.length, BIN_CHUNK),
  binChunk,
]);

writeFileSync(output, glb);
console.log(`${output} — ${(glb.length / 1024).toFixed(1)} KB`);
