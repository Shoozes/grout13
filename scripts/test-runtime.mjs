import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const expectedExports = [
  'DEFAULT_GROUT13_ATLAS_OPTIONS',
  'GROUT13_FORMAT_VERSION',
  'compileGrout13Atlas',
  'createGrout13BundleSourceFromCompiled',
  'createGrout13RuntimeSourceFromCompiled',
  'decodeGrout13Atlas',
  'escapeGrout13InlineScriptSource',
  'getGrout13PayloadBytes'
];

const moduleApi = await import(pathToFileURL(path.join(dist, 'grout13.mjs')).href);
assert.deepEqual(Object.keys(moduleApi).sort(), expectedExports.slice().sort());
assert.equal(moduleApi.GROUT13_FORMAT_VERSION, 1);

const compiled = moduleApi.compileGrout13Atlas([
  {
    name: 'pixel',
    spec: {
      w: 2,
      h: 2,
      steps: [{ type: 'rect_filled', x: 0, y: 0, w: 2, h: 2, col: 1 }],
      customPalette: [0xff0000]
    }
  }
], { runtimeTarget: 'rgba' });
assert.equal(compiled.runtimeContract.formatVersion, 1);
assert.equal(moduleApi.decodeGrout13Atlas(compiled.payload, { canvasFactory: () => null }).rgba.length, 16);

for (const fileName of ['grout13.global.js', 'grout13.global.min.js']) {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(dist, fileName), 'utf8'), context, { filename: fileName });
  assert.ok(context.GROUT13, `${fileName} should expose GROUT13`);
  assert.equal(context.GROUT13.GROUT13_FORMAT_VERSION, 1);
  assert.equal(typeof context.GROUT13.compileGrout13Atlas, 'function');
}

console.log('[OK] grout13 ESM and browser-global artifacts expose the reviewed facade');
