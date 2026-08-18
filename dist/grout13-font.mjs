// src/grout13-font.mjs
import { compileGrout13Atlas } from "./grout13.mjs";
var FORBIDDEN_GROUT13_NAME_LIST = [
  .../* @__PURE__ */ new Set([
    ...Object.getOwnPropertyNames(Object.prototype),
    "__proto__",
    "prototype"
  ])
];
FORBIDDEN_GROUT13_NAME_LIST.sort();
var FORBIDDEN_GROUT13_NAMES = Object.freeze(FORBIDDEN_GROUT13_NAME_LIST);
var FORBIDDEN_GROUT13_NAME_SET = Object.freeze(new Set(FORBIDDEN_GROUT13_NAMES));
function assertGrout13Name(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.includes("|") || /[\r\n]/.test(value) || /<\/script/i.test(value) || FORBIDDEN_GROUT13_NAME_SET.has(value)) {
    const reserved = FORBIDDEN_GROUT13_NAME_SET.has(value) ? `; reserved key "${value}" is not allowed` : "";
    throw new Error(
      `${label} must be a non-empty name without "|", line breaks, or "<\/script"${reserved}.`
    );
  }
}
var DEFAULT_LINE_HEIGHT_CELLS = 6;
function glyphFrameName(character) {
  const text = String(character != null ? character : "");
  if (text === " ") return "space";
  if (text.length !== 1) {
    throw new Error("Grout13 font glyph keys must be a single character.");
  }
  return text;
}
function normalizeGlyphRows(rows, label) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`${label} must be a non-empty array of row strings.`);
  }
  const normalized = rows.map((row, index) => {
    if (typeof row !== "string" || row.length === 0) {
      throw new Error(`${label} row ${index} must be a non-empty string.`);
    }
    if (/[^01]/.test(row)) {
      throw new Error(`${label} row ${index} must contain only 0 and 1.`);
    }
    return row;
  });
  const width = normalized[0].length;
  if (normalized.some((row) => row.length !== width)) {
    throw new Error(`${label} rows must all have the same width.`);
  }
  return normalized;
}
function glyphRowsToAsset(character, rows, sourceScale) {
  const name = glyphFrameName(character);
  assertGrout13Name(name, `Grout13 font glyph "${character}"`);
  const scale = sourceScale;
  const steps = [];
  for (let y = 0; y < rows.length; y += 1) {
    for (let x = 0; x < rows[y].length; x += 1) {
      if (rows[y][x] !== "1") continue;
      steps.push({
        type: "rect_filled",
        x: x * scale,
        y: y * scale,
        w: scale,
        h: scale,
        col: 16777215
      });
    }
  }
  return {
    name,
    spec: {
      w: rows[0].length * scale,
      h: rows.length * scale,
      steps
    }
  };
}
function positiveInt(value, label, fallback) {
  if (value === void 0 || value === null || value === "") return fallback;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return numeric;
}
function nonNegativeInt(value, label, fallback) {
  if (value === void 0 || value === null || value === "") return fallback;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return numeric;
}
function compileFontAtlas(options) {
  if (!options || typeof options !== "object") {
    throw new Error("compileFontAtlas requires an options object.");
  }
  const glyphs = options.glyphs;
  if (!glyphs || typeof glyphs !== "object" || Array.isArray(glyphs)) {
    throw new Error("compileFontAtlas requires a glyphs object.");
  }
  const keys = Object.keys(glyphs);
  if (keys.length === 0) throw new Error("compileFontAtlas requires at least one glyph.");
  const sourceScale = positiveInt(options.sourceScale, "sourceScale", 1);
  const tracking = nonNegativeInt(options.tracking, "tracking", sourceScale);
  const name = options.name ? String(options.name) : "grout13-font";
  assertGrout13Name(name, "compileFontAtlas name");
  const fallback = options.fallback === void 0 || options.fallback === null || options.fallback === "" ? glyphs["?"] ? "?" : keys[0] : String(options.fallback);
  if (!Object.prototype.hasOwnProperty.call(glyphs, fallback)) {
    throw new Error(`compileFontAtlas fallback "${fallback}" is missing from glyphs.`);
  }
  const assets = keys.map((character) => glyphRowsToAsset(character, normalizeGlyphRows(glyphs[character], `glyph "${character}"`), sourceScale));
  const supplied = options.compileOptions && typeof options.compileOptions === "object" ? options.compileOptions : {};
  const suppliedAtlas = supplied.atlasOptions && typeof supplied.atlasOptions === "object" ? supplied.atlasOptions : {};
  const compiled = compileGrout13Atlas(assets, {
    ...supplied,
    includeNames: true,
    atlasOptions: {
      layout: "packed",
      padding: 0,
      extrude: 0,
      maxWidth: 512,
      maxHeight: 512,
      ...suppliedAtlas,
      trim: false
    }
  });
  const glyphMetrics = {};
  for (const frame of compiled.frames) {
    glyphMetrics[frame.name] = {
      name: frame.name,
      width: Number(frame.sourceWidth || frame.width) || 0,
      height: Number(frame.sourceHeight || frame.height) || 0,
      advance: Number(frame.sourceWidth || frame.width) || 0
    };
  }
  const sample = glyphMetrics[glyphFrameName(fallback)];
  const lineHeight = positiveInt(
    options.lineHeight,
    "lineHeight",
    (sample && sample.height ? sample.height : DEFAULT_LINE_HEIGHT_CELLS * sourceScale) + sourceScale
  );
  return {
    name,
    atlas: compiled.atlas,
    compiled,
    glyphs: glyphMetrics,
    metrics: {
      sourceScale,
      tracking,
      lineHeight,
      fallback,
      fallbackFrame: glyphFrameName(fallback)
    }
  };
}
function measureFontText(font, text, options = {}) {
  if (!font || typeof font !== "object" || !font.glyphs || !font.metrics) {
    throw new Error("measureFontText requires a compiled font atlas.");
  }
  const scale = options.scale === void 0 ? 1 : Number(options.scale);
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error("measureFontText scale must be a positive finite number.");
  }
  const characters = String(text != null ? text : "");
  if (characters.length === 0) {
    return { width: 0, height: Number(font.metrics.lineHeight) * scale, characters: 0 };
  }
  const tracking = Number(font.metrics.tracking) || 0;
  let width = 0;
  for (let index = 0; index < characters.length; index += 1) {
    const frameName = glyphFrameName(characters[index]);
    const glyph = font.glyphs[frameName] || font.glyphs[font.metrics.fallbackFrame];
    if (!glyph) throw new Error(`measureFontText missing fallback glyph ${font.metrics.fallbackFrame}.`);
    width += glyph.advance * scale;
    if (index < characters.length - 1) width += tracking * scale;
  }
  return {
    width,
    height: Number(font.metrics.lineHeight) * scale,
    characters: characters.length
  };
}
export {
  compileFontAtlas,
  glyphFrameName,
  glyphRowsToAsset,
  measureFontText
};
