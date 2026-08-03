# grout13

`grout13` is the public Git module for Grout's compact JS13k-style atlas
compiler and generated runtime. It keeps the reviewed eight-export Grout13
facade self-contained so a tiny-game project can load a browser artifact
without installing `grout-render` or waiting for an npm release.

Repository: <https://github.com/Shoozes/grout13>

## Browser CDN usage

The Git-backed jsDelivr URL is the intended preview path:

```html
<script src="https://cdn.jsdelivr.net/gh/Shoozes/grout13@main/dist/grout13.global.min.js"></script>
<script>
  const compiled = GROUT13.compileGrout13Atlas([
    { name: 'player', spec: { w: 2, h: 2, steps: [{ type: 'fill', col: 1 }] } }
  ]);
</script>
```

For a browser ESM import:

```html
<script type="module">
  import { compileGrout13Atlas } from
    'https://cdn.jsdelivr.net/gh/Shoozes/grout13@main/dist/grout13.mjs';
</script>
```

Use `@main` for the current public preview. Pin a commit SHA when a game
needs reproducible bytes. This repository is a public Git/CDN delivery path,
not an npm release; `package.json` is retained for local builds and type-aware
editor tooling.

## Public facade

The module preserves the reviewed Grout13 v1 names:

- `GROUT13_FORMAT_VERSION`
- `DEFAULT_GROUT13_ATLAS_OPTIONS`
- `compileGrout13Atlas`
- `decodeGrout13Atlas`
- `createGrout13RuntimeSourceFromCompiled`
- `createGrout13BundleSourceFromCompiled`
- `escapeGrout13InlineScriptSource`
- `getGrout13PayloadBytes`

The compiler creates a single-page indexed atlas payload from Grout specs and
can emit a matching small canvas, RGBA, or indexed runtime. Research-only
layout and encoder candidates are intentionally excluded from this public
facade.

## Build and verify

The committed `dist/` files are the consumable Git artifacts. To rebuild them
from the bundled source and run the ESM/global smoke checks:

```bash
npm install
npm run verify
```

The module has no runtime dependency on npm, Phaser, or a network request.
