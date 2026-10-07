import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { build } = require(process.env.GROUT13_ESBUILD_PATH || 'esbuild');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src', 'grout13.mjs');
const dist = path.join(root, 'dist');

const fontSource = path.join(root, 'src', 'grout13-font.mjs');
if (!fs.existsSync(fontSource)) throw new Error('Missing required src/grout13-font.mjs');
const outputs = [];

const common = {
  entryPoints: [source],
  bundle: true,
  platform: 'browser',
  target: ['es2019'],
  legalComments: 'inline',
  logLevel: 'silent',
  write: false
};

outputs.push(...(await build({
  ...common,
  outfile: path.join(dist, 'grout13.mjs'),
  format: 'esm'
})).outputFiles);

outputs.push(...(await build({
  ...common,
  outfile: path.join(dist, 'grout13.global.js'),
  format: 'iife',
  globalName: 'GROUT13'
})).outputFiles);

outputs.push(...(await build({
  ...common,
  outfile: path.join(dist, 'grout13.global.min.js'),
  format: 'iife',
  globalName: 'GROUT13',
  minify: true
})).outputFiles);

outputs.push(...(await build({
  entryPoints: [fontSource],
  bundle: true,
  platform: 'browser',
  target: ['es2019'],
  legalComments: 'inline',
  logLevel: 'silent',
  write: false,
  outfile: path.join(dist, 'grout13-font.mjs'),
  format: 'esm',
  external: ['./grout13.mjs']
})).outputFiles);

// Prepare every artifact before writing; leave unrelated dist files intact.
fs.mkdirSync(dist, { recursive: true });
for (const output of outputs) fs.writeFileSync(output.path, output.contents);

console.log('Built grout13 ESM, font, and browser-global artifacts.');
