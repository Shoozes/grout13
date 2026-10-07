# grout13

## Role in our texture workflow

This module delivers small pixel atlases; the separate texture project authors
multi-channel surface materials, and GaimEngine receives ordinary assets.
Existing example artwork is an unapproved study, independent of runtime readiness.

| Source | Input → output | Evidence and limitation |
| --- | --- | --- |
| `src/grout13.mjs` → `dist/grout13.*` | Grout pixel recipes → indexed atlas and generated decoder | Artifact smoke passes; authored material channels are not its purpose |
| `src/grout13-font.mjs` | Pixel glyphs → ordinary atlas + metrics | Separate facade; existing smoke verifies no compiler rebundling |
| `scripts/build-runtime.mjs`, `test-runtime.mjs` | Canonical source → ESM/global artifacts and export proof | Build needs pinned esbuild; runtime has no npm/network dependency |

The canonical compiler still lives in Grout-Library and is synchronized here.
First qualify real pixel-asset delivery, then plan independence separately with
an explicit parent/child ownership switch. Do not change both copies in parallel.
Texture generation and pixel artwork refinement remain separate acceptance work.

The 2026-10-07 local repair synchronized the parent's resource guards. Parent,
child source, ESM and both browser globals now agree on the 256-asset,
16,777,216-source-pixel and 50,000-step budgets. Exact atlas/runtime roundtrips
and the eight-export facade are preserved. This verified batch is selected for
authorized Git main publication; pin its resulting commit for reproducible
receiving. CDN cache freshness is not independently asserted.

From Grout-Library, the local working-copy command is:

```bash
node scripts/sync-grout13-module.js --sync --module-dir C:/DevStuff/grout13 --preserve README.md --preserve scripts/build-runtime.mjs --preserve scripts/test-runtime.mjs --preserve .gitignore --preserve .tools/gitpush.ps1
```

Use `--check` in place of `--sync` to verify without rebuilding. Origin, branch
and named local-file guards remain active. Local overrides cannot publish;
failed sync restores generated artifacts, and the builder preserves unrelated
outputs. Source ownership remains in Grout-Library.

AI-edited: 2026-10-07 | agent=Codex/root | model=unknown | effort=unknown | task=compiler-guard-alignment | change=recorded local canonical parity and preserved publication boundary

AI-edited: 2026-10-07 | agent=Codex/root | model=unknown | effort=unknown | task=material-integrity | change=recorded verified compiler guard drift and bounded follow-up

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

## Optional font compiler

`grout13/font` is a build-time companion, not part of the eight-export core.
It compiles pixel-glyph tables into a normal Grout13 atlas plus metrics. The
browser game only needs the core decoder after the font payload is generated.

```js
import { compileFontAtlas, measureFontText } from 'grout13/font';

const font = compileFontAtlas({
  name: 'pixel-3x5',
  sourceScale: 4,
  tracking: 4,
  lineHeight: 24,
  fallback: '?',
  glyphs: {
    A: ['010', '101', '111', '101', '101'],
    ' ': ['00', '00', '00', '00', '00'],
    '?': ['111', '001', '010', '000', '010']
  }
});

const size = measureFontText(font, 'A');
```

The font module imports `compileGrout13Atlas` from `./grout13.mjs`. It does
not ship a second copy of the compiler. Core still does not export font
helpers.

## Build and verify

The committed `dist/` files are the consumable Git artifacts. To rebuild them
from the bundled source and run the ESM/global smoke checks:

```bash
npm install
npm run verify
```

The module has no runtime dependency on npm, Phaser, or a network request.

## Reviewed Git publication

The local `.tools/gitpush.ps1` delegates to the qualified Grout-Library owner.
Stage only reviewed named files and write a UTF-8 JSON allowlist, for example
`{"paths":["README.md"]}`, under ignored `.artifacts`. Then use:

```powershell
pwsh -NoProfile -File .tools/gitpush.ps1 -PublisherRoot C:/DevStuff/Grout-Library -StagedOnly -Yes -Allowlist .artifacts/publication-paths.json -Message "Describe the verified change"
```

Existing main and the registered origin must agree after fetch. Unrelated
staging, unsafe history and private paths are rejected; credentials stay in the
parent. The owner tests pass 49 assertions on PowerShell 7 and 5.1. This saves
Git progress only; npm publication and compiler independence remain separate.

AI-edited: 2026-10-07 | agent=Codex/root | model=unknown | effort=unknown | task=texture-tools-publish | change=documented qualified parent delegation and selected compiler progress


AI-edited: 2026-10-07 | agent=Codex/root | model=unknown | effort=unknown | task=texture-tools | change=recorded donor ownership, approval boundary and compiler qualification
