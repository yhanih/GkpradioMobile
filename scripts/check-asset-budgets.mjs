#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const distAssetsDir = path.resolve(process.cwd(), 'dist/public/assets');
const budgets = [
  { pattern: /^vendor-.*\.js$/, maxKB: 200 },
  { pattern: /^index-.*\.css$/, maxKB: 150 },
  { pattern: /^.*\.(png|jpg|jpeg|svg)$/i, maxKB: 400 },
];

function formatKB(bytes) { return (bytes / 1024).toFixed(2) + ' kB'; }

let failed = false;
const files = fs.existsSync(distAssetsDir) ? fs.readdirSync(distAssetsDir) : [];
for (const file of files) {
  const stat = fs.statSync(path.join(distAssetsDir, file));
  if (!stat.isFile()) continue;
  for (const b of budgets) {
    if (b.pattern.test(file)) {
      const sizeKB = stat.size / 1024;
      if (sizeKB > b.maxKB) {
        console.error(`Budget exceeded: ${file} is ${formatKB(stat.size)} (> ${b.maxKB} kB)`);
        failed = true;
      }
      break;
    }
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('All asset budgets within limits.');
}
