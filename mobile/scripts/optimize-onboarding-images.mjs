#!/usr/bin/env node
/**
 * Resize + compress onboarding PNGs for fast decode on device.
 * Run: npm install --no-save sharp && node scripts/optimize-onboarding-images.mjs
 * (sharp is not a project dependency — EAS builds must not install native image tooling.)
 */
import { readdir, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../assets/onboarding');
const MAX = 400;

const files = (await readdir(dir)).filter((f) => f.startsWith('onboarding-') && f.endsWith('.png'));

for (const file of files) {
  const input = path.join(dir, file);
  const tmp = `${input}.optimized`;
  const before = (await import('node:fs/promises')).stat(input);

  await sharp(input)
    .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
    .toFile(tmp);

  await unlink(input);
  await rename(tmp, input);

  const after = await import('node:fs/promises').then((fs) => fs.stat(input));
  console.log(
    `${file}: ${(before.size / 1024).toFixed(0)}KB → ${(after.size / 1024).toFixed(0)}KB`
  );
}

console.log('Done.');
