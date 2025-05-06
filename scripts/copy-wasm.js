import { copyFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const wasmFiles = ['bsdiff.wasm', 'bspatch.wasm'];

const srcDir = resolve('node_modules/bsdiff-wasm/dist');
const destDir = resolve('public');

mkdirSync(destDir, { recursive: true });

for (const file of wasmFiles) {
  const src = resolve(srcDir, file);
  const dest = resolve(destDir, file);
  try {
    copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  } catch (err) {
    console.error(`Failed to copy ${file}:`, err.message);
  }
}