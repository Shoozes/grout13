import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { build } = require(process.env.GROUT13_ESBUILD_PATH || 'esbuild');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src', 'grout13.mjs');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const common = {
  entryPoints: [source],
  bundle: true,
  platform: 'browser',
  target: ['es2019'],
  legalComments: 'inline',
  logLevel: 'silent'
};

await build({
  ...common,
  outfile: path.join(dist, 'grout13.mjs'),
  format: 'esm'
});

await build({
  ...common,
  outfile: path.join(dist, 'grout13.global.js'),
  format: 'iife',
  globalName: 'GROUT13'
});

await build({
  ...common,
  outfile: path.join(dist, 'grout13.global.min.js'),
  format: 'iife',
  globalName: 'GROUT13',
  minify: true
});

const fontSource = path.join(root, 'src', 'grout13-font.mjs');
if (!fs.existsSync(fontSource)) {
  throw new Error('Missing required src/grout13-font.mjs');
}

await build({
  entryPoints: [fontSource],
  bundle: true,
  platform: 'browser',
  target: ['es2019'],
  legalComments: 'inline',
  logLevel: 'silent',
  outfile: path.join(dist, 'grout13-font.mjs'),
  format: 'esm',
  external: ['./grout13.mjs']
});

console.log('Built grout13 ESM, font, and browser-global artifacts.');
