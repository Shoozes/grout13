var GROUT13 = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/grout13.mjs
  var grout13_exports = {};
  __export(grout13_exports, {
    DEFAULT_GROUT13_ATLAS_OPTIONS: () => DEFAULT_GROUT13_ATLAS_OPTIONS,
    GROUT13_FORMAT_VERSION: () => GROUT13_FORMAT_VERSION,
    compileGrout13Atlas: () => compileGrout13Atlas,
    createGrout13BundleSourceFromCompiled: () => createGrout13BundleSourceFromCompiled,
    createGrout13RuntimeSourceFromCompiled: () => createGrout13RuntimeSourceFromCompiled,
    decodeGrout13Atlas: () => decodeGrout13Atlas,
    escapeGrout13InlineScriptSource: () => escapeGrout13InlineScriptSource,
    getGrout13PayloadBytes: () => getGrout13PayloadBytes
  });
  function createSeededRandom(seed) {
    let state = seed !== void 0 && seed !== null ? seed : Date.now();
    return {
      next() {
        state = state * 1664525 + 1013904223 >>> 0;
        return state / 4294967296;
      },
      // Return integer in range [min, max]
      nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
      },
      // Return float in range [min, max]
      nextFloat(min, max) {
        return this.next() * (max - min) + min;
      }
    };
  }
  function applyProbabilisticSteps(steps, random, options = {}) {
    const { layerProbabilities = {} } = options;
    const layerRolls = {};
    return steps.filter((step) => {
      if (step.probability !== void 0) {
        if (random.next() > step.probability) {
          return false;
        }
      }
      if (step.layer !== void 0) {
        const layerName = step.layer;
        if (!(layerName in layerRolls)) {
          const layerProb = layerProbabilities[layerName] !== void 0 ? layerProbabilities[layerName] : step.groupProbability !== void 0 ? step.groupProbability : 1;
          layerRolls[layerName] = random.next() <= layerProb;
        }
        return layerRolls[layerName];
      }
      return true;
    });
  }
  var DEFAULT_MAX_EXPANDED_HEX_LENGTH = 1024 * 1024;
  function validDimension(value, fallback = 32) {
    return Number.isInteger(value) && value > 0 && value <= 4096 ? value : fallback;
  }
  function unpackBits(hex, totalPixels) {
    if (typeof hex !== "string" || typeof totalPixels !== "number" || totalPixels <= 0) {
      return null;
    }
    const cleanHex = hex.replace(/[^0-9A-F]/gi, "");
    if (cleanHex.length * 4 < totalPixels || cleanHex.length * 4 - totalPixels >= 4) {
      return null;
    }
    const data = [];
    for (let i = 0; i < cleanHex.length; i++) {
      const val = parseInt(cleanHex[i], 16);
      if (Number.isNaN(val)) {
        return null;
      }
      if (data.length < totalPixels) data.push(val >> 3 & 1);
      if (data.length < totalPixels) data.push(val >> 2 & 1);
      if (data.length < totalPixels) data.push(val >> 1 & 1);
      if (data.length < totalPixels) data.push(val >> 0 & 1);
    }
    return data;
  }
  function appendRepeated(parts, value, count, maxOutputLength) {
    if (!Number.isSafeInteger(count) || count < 0) return false;
    const nextLength = parts.lengthSoFar + value.length * count;
    if (nextLength > maxOutputLength) return false;
    parts.push(value.repeat(count));
    parts.lengthSoFar = nextLength;
    return true;
  }
  function decompressHex(hex, options = {}) {
    if (typeof hex !== "string") {
      return "";
    }
    const maxOutputLength = Number.isInteger(options.maxOutputLength) && options.maxOutputLength > 0 ? options.maxOutputLength : DEFAULT_MAX_EXPANDED_HEX_LENGTH;
    let s = hex;
    let max = 50;
    while (s.includes("{") && max-- > 0) {
      const old = s;
      s = s.replace(/\{([^{}]+?)\*(\d+)\}/g, (match2, seq, n) => {
        const count = Number(n);
        if (!Number.isSafeInteger(count) || count < 0 || seq.length * count > maxOutputLength) {
          return "\0";
        }
        return seq.repeat(count);
      });
      if (s.includes("\0") || s.length > maxOutputLength) return "";
      if (s === old) break;
    }
    const parts = [];
    parts.lengthSoFar = 0;
    const tokenPattern = /\((\d+)\)|\(([A-E])(\d+)\)|\[(\d+)\]/g;
    let cursor = 0;
    let match;
    while (match = tokenPattern.exec(s)) {
      const literal = s.slice(cursor, match.index);
      if (!appendRepeated(parts, literal, 1, maxOutputLength)) return "";
      if (match[1] !== void 0) {
        if (!appendRepeated(parts, "0", Number(match[1]), maxOutputLength)) return "";
      } else if (match[2] !== void 0) {
        if (!appendRepeated(parts, match[2], Number(match[3]), maxOutputLength)) return "";
      } else if (match[4] !== void 0) {
        if (!appendRepeated(parts, "F", Number(match[4]), maxOutputLength)) return "";
      }
      cursor = match.index + match[0].length;
    }
    if (!appendRepeated(parts, s.slice(cursor), 1, maxOutputLength)) return "";
    return parts.join("");
  }
  function decompressMultiPlot(compressed, maxValue = 32, height = maxValue) {
    if (typeof compressed !== "string" || compressed.length === 0) {
      return null;
    }
    const width = validDimension(maxValue);
    const gridHeight = validDimension(height, width);
    const totalPixels = width * gridHeight;
    const expanded = decompressHex(compressed, { maxOutputLength: Math.ceil(totalPixels / 4) + 4 });
    if (!expanded) return null;
    const bitmap = unpackBits(expanded, totalPixels);
    if (!bitmap) {
      return null;
    }
    const data = [];
    for (let i = 0; i < bitmap.length; i++) {
      if (bitmap[i] === 1) {
        const x = i % width;
        const y = Math.floor(i / width);
        data.push(x, y);
      }
    }
    return data;
  }
  var TRANSPARENT_COLOR = -1;
  var RGB_TOKEN_BASE = 4294967296;
  var RGBA_TOKEN_BASE = 8589934592;
  function clampByte(value) {
    return Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
  }
  function createRgbToken(r, g, b) {
    const rgb24 = clampByte(r) << 16 | clampByte(g) << 8 | clampByte(b);
    return RGB_TOKEN_BASE + rgb24;
  }
  function isRgbToken(value) {
    return Number.isSafeInteger(value) && value >= RGB_TOKEN_BASE && value < RGB_TOKEN_BASE + 16777216;
  }
  function isRgbaToken(value) {
    return Number.isSafeInteger(value) && value >= RGBA_TOKEN_BASE && value <= RGBA_TOKEN_BASE + 4294967295;
  }
  function isColorToken(value) {
    return isRgbToken(value) || isRgbaToken(value);
  }
  function colorTokenToInternalRgba32(value) {
    if (isRgbToken(value)) {
      const rgb24 = value - RGB_TOKEN_BASE;
      const r = rgb24 >> 16 & 255;
      const g = rgb24 >> 8 & 255;
      const b = rgb24 & 255;
      return r << 24 | g << 16 | b << 8 | 255 | 0;
    }
    if (isRgbaToken(value)) {
      const argb = value - RGBA_TOKEN_BASE >>> 0;
      const a = argb >>> 24 & 255;
      const r = argb >>> 16 & 255;
      const g = argb >>> 8 & 255;
      const b = argb & 255;
      return r << 24 | g << 16 | b << 8 | a | 0;
    }
    throw new Error("Expected tagged color token");
  }
  function legacyColorToInternalRgba32(value) {
    if (value < TRANSPARENT_COLOR || value > 16777215) {
      const a = value >>> 24 & 255;
      const r2 = value >>> 16 & 255;
      const g2 = value >>> 8 & 255;
      const b2 = value & 255;
      return r2 << 24 | g2 << 16 | b2 << 8 | a | 0;
    }
    const r = value >> 16 & 255;
    const g = value >> 8 & 255;
    const b = value & 255;
    return r << 24 | g << 16 | b << 8 | 255 | 0;
  }
  function colorValueToInternalRgba32(value) {
    return isColorToken(value) ? colorTokenToInternalRgba32(value) : legacyColorToInternalRgba32(value);
  }
  function rotateBuffer(buffer, w, h, degrees) {
    if (!ArrayBuffer.isView(buffer) || typeof buffer.length !== "number") {
      throw new Error("rotateBuffer requires a typed-array buffer");
    }
    if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) {
      throw new Error(`Invalid dimensions: width and height must be positive integers (got w=${w}, h=${h})`);
    }
    if (buffer.length !== w * h) {
      throw new Error(`rotateBuffer buffer length must equal w * h (expected ${w * h}, got ${buffer.length})`);
    }
    if (!Number.isFinite(degrees) || !Number.isInteger(degrees)) {
      throw new Error("rotateBuffer degrees must be a multiple of 90");
    }
    const rot = (degrees % 360 + 360) % 360;
    if (![0, 90, 180, 270].includes(rot)) throw new Error("rotateBuffer degrees must be a multiple of 90");
    if (rot === 0) return { buffer, w, h };
    if (rot === 180) {
      const out2 = new Int32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          out2[(h - 1 - y) * w + (w - 1 - x)] = buffer[y * w + x];
        }
      }
      return { buffer: out2, w, h };
    }
    const newW = h;
    const newH = w;
    const out = new Int32Array(newW * newH);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = rot === 90 ? h - 1 - y : y;
        const ny = rot === 90 ? x : w - 1 - x;
        out[ny * newW + nx] = buffer[y * w + x];
      }
    }
    return { buffer: out, w: newW, h: newH };
  }
  function flipBuffer(buffer, w, h, flipX, flipY) {
    if (!flipX && !flipY) return buffer;
    const out = new Int32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sx = flipX ? w - 1 - x : x;
        const sy = flipY ? h - 1 - y : y;
        out[y * w + x] = buffer[sy * w + sx];
      }
    }
    return out;
  }
  function outlineBuffer(buffer, w, h, color = 0, thickness = 1) {
    if (thickness < 1) return buffer;
    const out = new Int32Array(buffer);
    const edgePixels = /* @__PURE__ */ new Set();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const index = y * w + x;
        if (buffer[index] === -1) continue;
        let hasTransparentNeighbor = false;
        for (let dy = -1; dy <= 1 && !hasTransparentNeighbor; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h || buffer[ny * w + nx] === -1) {
              hasTransparentNeighbor = true;
              break;
            }
          }
        }
        if (hasTransparentNeighbor) edgePixels.add(index);
      }
    }
    for (const edgeIndex of edgePixels) {
      const edgeX = edgeIndex % w;
      const edgeY = Math.floor(edgeIndex / w);
      for (let dy = -thickness; dy <= thickness; dy++) {
        for (let dx = -thickness; dx <= thickness; dx++) {
          if (Math.sqrt(dx * dx + dy * dy) > thickness) continue;
          const x = edgeX + dx;
          const y = edgeY + dy;
          if (x >= 0 && x < w && y >= 0 && y < h && buffer[y * w + x] === -1) {
            out[y * w + x] = color;
          }
        }
      }
    }
    return out;
  }
  var MAX_RUNTIME_FRAMES = 256;
  var MAX_RUNTIME_STEPS = 5e4;
  var MAX_RUNTIME_SEQUENCE_ENTRIES = 1e4;
  var MAX_RUNTIME_PALETTE_ENTRIES = 256;
  function throwIfRenderCancelled(shouldCancel) {
    if (typeof shouldCancel === "function" && shouldCancel()) {
      const error = new Error("Render job cancelled");
      error.code = "ERR_RENDER_CANCELLED";
      throw error;
    }
  }
  var DEFAULT_PALETTE_RGB24 = [
    // Basic colors (0-15) - Original palette maintained for backward compatibility
    0,
    16777215,
    8947848,
    4473924,
    13421772,
    16753920,
    16711680,
    65280,
    255,
    16776960,
    16711935,
    65535,
    9127187,
    16761035,
    8388736,
    32768,
    // Extended colors (16-31) - Common useful colors
    8388608,
    8421376,
    128,
    8388736,
    32896,
    12632256,
    8421504,
    10066431,
    10040166,
    16777164,
    13434879,
    6684774,
    16744576,
    26316,
    13421823,
    16711884,
    // Grayscale gradient (32-47)
    1118481,
    2236962,
    3355443,
    5592405,
    6710886,
    7829367,
    10066329,
    11184810,
    12303291,
    14540253,
    15658734,
    15790320,
    16316664,
    16448250,
    16579836,
    16711422,
    // Red spectrum (48-63)
    3342336,
    6684672,
    10027008,
    13369344,
    16724787,
    16737894,
    16751001,
    16764108,
    16772846,
    9109504,
    14423100,
    16716947,
    16738740,
    16758465,
    16761035,
    16770273,
    // Orange/Yellow spectrum (64-79)
    16729344,
    16737095,
    16744272,
    16752762,
    16766720,
    16767673,
    16770229,
    16775388,
    16775885,
    16777113,
    15787660,
    15657130,
    12433259,
    14329120,
    12092939,
    13468991,
    // Green spectrum (80-95)
    13056,
    26112,
    39168,
    52224,
    65331,
    65382,
    65433,
    65484,
    65518,
    9498256,
    10025880,
    9419919,
    3978097,
    3050327,
    2263842,
    25600,
    // Cyan/Blue spectrum (96-111)
    51,
    102,
    153,
    204,
    3355647,
    6711039,
    10066431,
    13421823,
    15658751,
    8900331,
    8900346,
    4620980,
    6266528,
    6591981,
    49151,
    2003199,
    // Purple/Magenta spectrum (112-127)
    3342387,
    6684774,
    10027161,
    13369548,
    16724991,
    16738047,
    16751103,
    16764159,
    16772863,
    14315734,
    15631086,
    14524637,
    12211667,
    9662683,
    9109643,
    4915330,
    // Earth tones (128-143)
    9127187,
    10506797,
    13789470,
    13468991,
    14596231,
    16113331,
    16032864,
    13808780,
    12357519,
    15787660,
    10145074,
    5597999,
    7048739,
    8421376,
    12092939,
    14329120,
    // Pastel colors (144-159)
    16770273,
    16767673,
    16768685,
    16772045,
    16113331,
    16775388,
    16775920,
    16777200,
    15794160,
    16121850,
    15794175,
    15792383,
    15132410,
    16773365,
    16770273,
    16444375,
    // Neon colors (160-175)
    16713530,
    16711935,
    65535,
    65280,
    16776960,
    16737792,
    16711833,
    10289407,
    8255999,
    3800852,
    16777011,
    16662884,
    16646554,
    587774,
    12325886,
    11992832,
    // Web safe colors (176-191)
    6697881,
    10053171,
    13408614,
    6737100,
    10079385,
    13395609,
    6723993,
    10066278,
    13408665,
    10053324,
    13421670,
    6724044,
    10079436,
    13408716,
    16764057,
    10092492,
    // Dark variations (192-207)
    3100495,
    1644912,
    9127817,
    4734347,
    3100463,
    9139029,
    9127187,
    9136404,
    5597999,
    9145088,
    4915330,
    3539263,
    2897209,
    1842204,
    788746,
    2824983,
    // Light variations (208-223)
    16775930,
    16119285,
    16445670,
    16643558,
    16775920,
    16119260,
    16774638,
    16448210,
    16770244,
    16772045,
    16770229,
    16768685,
    16113331,
    16775388,
    16775885,
    16448250,
    // Metallic (224-239)
    12632256,
    13882323,
    14474460,
    15263976,
    16766720,
    16753920,
    16747520,
    16770229,
    16772045,
    15787660,
    14329120,
    12092939,
    13467442,
    12088115,
    9858867,
    9205843,
    // RGB spectrum (240-255) - Pure RGB mixes
    16711680,
    65280,
    255,
    16776960,
    16711935,
    65535,
    16744448,
    16711808,
    8453888,
    65408,
    8388863,
    33023,
    12632256,
    4210752,
    2105376,
    16777215
  ];
  var DEFAULT_PALETTE_RGBA32 = DEFAULT_PALETTE_RGB24.map((rgb24) => {
    const r = rgb24 >> 16 & 255;
    const g = rgb24 >> 8 & 255;
    const b = rgb24 & 255;
    const a = 255;
    return a << 24 | r << 16 | g << 8 | b | 0;
  });
  function resolveCompactStreamType(rawType) {
    if (typeof rawType !== "string") return rawType;
    return SHORTHAND_TYPES[rawType] || rawType;
  }
  function decodeCompactStreamStep(rawType, args, currentColor) {
    var _a, _b, _c, _d, _e;
    const type = resolveCompactStreamType(rawType);
    if (!type) {
      throw new Error("Compact draw tuple is missing a type");
    }
    switch (type) {
      case "plot":
        if (args.length !== 2 && args.length !== 3) {
          throw new Error(`Compact plot tuple must have 2 or 3 values (got ${args.length})`);
        }
        return { type, x: args[0], y: args[1], col: (_a = args[2]) != null ? _a : currentColor };
      case "line":
        if (args.length !== 4 && args.length !== 5) {
          throw new Error(`Compact line tuple must have 4 or 5 values (got ${args.length})`);
        }
        return {
          type,
          x1: args[0],
          y1: args[1],
          x2: args[2],
          y2: args[3],
          col: (_b = args[4]) != null ? _b : currentColor
        };
      case "rect":
      case "rect_filled":
      case "circle":
      case "circle_filled":
      case "heart":
      case "heart_filled":
      case "shield":
      case "shield_filled":
        if (args.length !== 4 && args.length !== 5) {
          throw new Error(`Compact ${type} tuple must have 4 or 5 values (got ${args.length})`);
        }
        return {
          type,
          x: args[0],
          y: args[1],
          w: args[2],
          h: args[3],
          col: (_c = args[4]) != null ? _c : currentColor
        };
      case "fill":
        if (args.length > 1) {
          throw new Error(`Compact fill tuple must have 0 or 1 values (got ${args.length})`);
        }
        return { type, col: (_d = args[0]) != null ? _d : currentColor };
      case "flood_fill":
        if (args.length !== 2 && args.length !== 3) {
          throw new Error(`Compact flood_fill tuple must have 2 or 3 values (got ${args.length})`);
        }
        return { type, x: args[0], y: args[1], col: (_e = args[2]) != null ? _e : currentColor };
      default:
        throw new Error(`Unsupported compact draw tuple type: ${rawType}`);
    }
  }
  function expandCompactStepStream(entries) {
    var _a;
    if (!Array.isArray(entries)) return entries;
    const steps = [];
    let currentType = null;
    let currentColor = 0;
    for (const entry of entries) {
      if (entry === null || entry === void 0) continue;
      if (!Array.isArray(entry)) {
        steps.push(entry);
        continue;
      }
      if (entry.length === 0) continue;
      const head = entry[0];
      if (typeof head === "string") {
        if (head === "t") {
          currentType = resolveCompactStreamType(entry[1]);
          if (!currentType) {
            throw new Error("Compact draw stream type command requires a valid type");
          }
          continue;
        }
        if (head === "c") {
          currentColor = (_a = entry[1]) != null ? _a : 0;
          continue;
        }
        steps.push(decodeCompactStreamStep(head, entry.slice(1), currentColor));
        continue;
      }
      if (typeof head === "number") {
        if (!currentType) {
          throw new Error('Compact draw tuple requires a current type. Add ["t","rf"] or use an explicit typed tuple.');
        }
        steps.push(decodeCompactStreamStep(currentType, entry, currentColor));
        continue;
      }
      throw new Error("Compact draw stream entries must be arrays, objects, or control commands");
    }
    return steps;
  }
  function rgb24ToHsl(rgb24) {
    const r = (rgb24 >> 16 & 255) / 255;
    const g = (rgb24 >> 8 & 255) / 255;
    const b = (rgb24 & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          break;
        case g:
          h = ((b - r) / d + 2) * 60;
          break;
        case b:
          h = ((r - g) / d + 4) * 60;
          break;
      }
    }
    return { h, s, l };
  }
  function hslToRgb24(h, s, l) {
    h = (h % 360 + 360) % 360;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p2, q2, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
        if (t < 1 / 2) return q2;
        if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
        return p2;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h / 360 + 1 / 3);
      g = hue2rgb(p, q, h / 360);
      b = hue2rgb(p, q, h / 360 - 1 / 3);
    }
    return Math.round(r * 255) << 16 | Math.round(g * 255) << 8 | Math.round(b * 255);
  }
  function shiftHue(rgb24, hueShift) {
    if (hueShift === 0) return rgb24;
    const { h, s, l } = rgb24ToHsl(rgb24);
    return hslToRgb24(h + hueShift, s, l);
  }
  function shiftPaletteHue(palette, hueShift) {
    if (hueShift === 0) return palette;
    return palette.map((color) => shiftHue(color, hueShift));
  }
  var SHORTHAND_MODS = {
    "x": "fx",
    // flip x
    "y": "fy",
    // flip y
    "9": "rot90",
    // rotate 90
    "8": "rot180",
    // rotate 180 (think upside down 8)
    "7": "rot270"
    // rotate 270
  };
  function parseModifier(mod) {
    if (typeof mod !== "string") return null;
    const expanded = SHORTHAND_MODS[mod];
    if (expanded) {
      mod = expanded;
    }
    const modLower = mod.toLowerCase();
    if (modLower === "fx" || modLower === "flipx" || modLower === "flip-h") {
      return { type: "fx", value: true };
    }
    if (modLower === "fy" || modLower === "flipy" || modLower === "flip-v") {
      return { type: "fy", value: true };
    }
    const rotMatch = modLower.match(/^rot(?:ate)?(\d+)$/);
    if (rotMatch) {
      return { type: "rot", value: parseInt(rotMatch[1], 10) };
    }
    const hueMatch = modLower.match(/^hue([+-]?\d+)$/);
    if (hueMatch) {
      return { type: "hue", value: parseInt(hueMatch[1], 10) };
    }
    if (modLower === "outline") {
      return { type: "outline", value: { color: 0, thickness: 1 } };
    }
    const outlineThicknessMatch = modLower.match(/^outline(\d+)$/);
    if (outlineThicknessMatch) {
      return {
        type: "outline",
        value: { color: 0, thickness: parseInt(outlineThicknessMatch[1], 10) }
      };
    }
    const outlineColorMatch = modLower.match(/^outline-c(\d+)$/);
    if (outlineColorMatch) {
      return {
        type: "outline",
        value: { color: parseInt(outlineColorMatch[1], 10), thickness: 1 }
      };
    }
    const outlineFullMatch = modLower.match(/^outline(\d+)-c(\d+)$/);
    if (outlineFullMatch) {
      return {
        type: "outline",
        value: {
          color: parseInt(outlineFullMatch[2], 10),
          thickness: parseInt(outlineFullMatch[1], 10)
        }
      };
    }
    return null;
  }
  function normalizeSpec(input) {
    var _a, _b, _c, _d;
    try {
      if (input === null || input === void 0) {
        input = {};
      }
      if (typeof input !== "object") {
        throw new Error("Specification must be an object");
      }
      const spec = JSON.parse(JSON.stringify(input));
      spec.w = (_a = spec.w) != null ? _a : 16;
      spec.h = (_b = spec.h) != null ? _b : 16;
      if (typeof spec.w !== "number" || spec.w <= 0 || spec.w > 4096) {
        throw new Error("Width must be a positive number between 1 and 4096");
      }
      if (typeof spec.h !== "number" || spec.h <= 0 || spec.h > 4096) {
        throw new Error("Height must be a positive number between 1 and 4096");
      }
      spec.fps = (_c = spec.fps) != null ? _c : 8;
      if (typeof spec.fps !== "number" || spec.fps <= 0 || spec.fps > 120) {
        throw new Error("FPS must be a positive number between 1 and 120");
      }
      if (spec.d !== void 0 && spec.steps === void 0 && spec.frames === void 0) {
        spec.steps = spec.d;
        delete spec.d;
      }
      if (spec.s !== void 0 && spec.steps === void 0 && spec.frames === void 0) {
        spec.steps = spec.s;
        delete spec.s;
      }
      if (spec.steps && !spec.frames) {
        if (!Array.isArray(spec.steps)) {
          throw new Error("steps must be an array");
        }
        spec.frames = [{ steps: spec.steps }];
        delete spec.steps;
      }
      if (spec.pal && !spec.customPalette) {
        spec.customPalette = spec.pal;
        delete spec.pal;
      }
      for (const paletteField of ["palette", "customPalette"]) {
        if (Array.isArray(spec[paletteField]) && spec[paletteField].length > MAX_RUNTIME_PALETTE_ENTRIES) {
          throw new Error(`${paletteField} must contain at most ${MAX_RUNTIME_PALETTE_ENTRIES} entries`);
        }
      }
      spec.frames = (_d = spec.frames) != null ? _d : [{ steps: [] }];
      if (!Array.isArray(spec.frames)) {
        throw new Error("frames must be an array");
      }
      if (spec.frames.length > MAX_RUNTIME_FRAMES) {
        throw new Error(`frames must contain at most ${MAX_RUNTIME_FRAMES} entries`);
      }
      let totalSteps = 0;
      spec.frames.forEach((f, i) => {
        var _a2;
        if (!f || typeof f !== "object") {
          throw new Error(`Frame ${i} must be an object`);
        }
        if (f.d !== void 0 && f.steps === void 0) {
          f.steps = f.d;
          delete f.d;
        }
        if (f.s !== void 0 && f.steps === void 0) {
          f.steps = f.s;
          delete f.s;
        }
        f.steps = (_a2 = f.steps) != null ? _a2 : [];
        if (!Array.isArray(f.steps)) {
          throw new Error(`Frame ${i} steps must be an array`);
        }
        f.steps = expandCompactStepStream(f.steps);
        totalSteps += f.steps.length;
        if (totalSteps > MAX_RUNTIME_STEPS) {
          throw new Error(`spec must contain at most ${MAX_RUNTIME_STEPS} drawing steps`);
        }
      });
      if (!spec.sequence) {
        spec.sequence = spec.frames.map((_, i) => i);
      }
      if (!Array.isArray(spec.sequence)) {
        throw new Error("sequence must be an array");
      }
      if (spec.sequence.length > MAX_RUNTIME_SEQUENCE_ENTRIES) {
        throw new Error(`sequence must contain at most ${MAX_RUNTIME_SEQUENCE_ENTRIES} entries`);
      }
      if (spec.sequence.length === 0) {
        spec.sequence = [0];
      }
      return spec;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse specification: ${error.message}`);
      }
      throw error;
    }
  }
  function parsePathString(pathData, col = 0) {
    if (!pathData || typeof pathData !== "string") return [];
    const steps = [];
    let currentX = 0, currentY = 0;
    let startX = 0, startY = 0;
    const commands = pathData.match(/[MLHVCQZmlhvcqz][^MLHVCQZmlhvcqz]*/g) || [];
    for (const cmd of commands) {
      const type = cmd[0];
      const args = cmd.slice(1).trim().split(/[\s,]+/).filter((s) => s).map(Number);
      const isRelative = type === type.toLowerCase();
      switch (type.toUpperCase()) {
        case "M": {
          currentX = isRelative ? currentX + args[0] : args[0];
          currentY = isRelative ? currentY + args[1] : args[1];
          startX = currentX;
          startY = currentY;
          break;
        }
        case "L": {
          const x2 = isRelative ? currentX + args[0] : args[0];
          const y2 = isRelative ? currentY + args[1] : args[1];
          steps.push({
            type: "line",
            x1: currentX,
            y1: currentY,
            x2,
            y2,
            col
          });
          currentX = x2;
          currentY = y2;
          break;
        }
        case "H": {
          const x2 = isRelative ? currentX + args[0] : args[0];
          steps.push({
            type: "line",
            x1: currentX,
            y1: currentY,
            x2,
            y2: currentY,
            col
          });
          currentX = x2;
          break;
        }
        case "V": {
          const y2 = isRelative ? currentY + args[0] : args[0];
          steps.push({
            type: "line",
            x1: currentX,
            y1: currentY,
            x2: currentX,
            y2,
            col
          });
          currentY = y2;
          break;
        }
        case "C": {
          for (let i = 0; i < args.length; i += 6) {
            const cp1x = isRelative ? currentX + args[i] : args[i];
            const cp1y = isRelative ? currentY + args[i + 1] : args[i + 1];
            const cp2x = isRelative ? currentX + args[i + 2] : args[i + 2];
            const cp2y = isRelative ? currentY + args[i + 3] : args[i + 3];
            const x2 = isRelative ? currentX + args[i + 4] : args[i + 4];
            const y2 = isRelative ? currentY + args[i + 5] : args[i + 5];
            steps.push({
              type: "bezier_cubic",
              x1: currentX,
              y1: currentY,
              cp1x,
              cp1y,
              cp2x,
              cp2y,
              x2,
              y2,
              col
            });
            currentX = x2;
            currentY = y2;
          }
          break;
        }
        case "Q": {
          for (let i = 0; i < args.length; i += 4) {
            const cpx = isRelative ? currentX + args[i] : args[i];
            const cpy = isRelative ? currentY + args[i + 1] : args[i + 1];
            const x2 = isRelative ? currentX + args[i + 2] : args[i + 2];
            const y2 = isRelative ? currentY + args[i + 3] : args[i + 3];
            steps.push({
              type: "bezier_quadratic",
              x1: currentX,
              y1: currentY,
              cpx,
              cpy,
              x2,
              y2,
              col
            });
            currentX = x2;
            currentY = y2;
          }
          break;
        }
        case "Z": {
          if (currentX !== startX || currentY !== startY) {
            steps.push({
              type: "line",
              x1: currentX,
              y1: currentY,
              x2: startX,
              y2: startY,
              col
            });
            currentX = startX;
            currentY = startY;
          }
          break;
        }
      }
    }
    return steps;
  }
  function parseSegments(segments, col = 0) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
    if (!Array.isArray(segments) || segments.length === 0) return [];
    if (!Array.isArray(segments[0]) || segments[0].length < 2) {
      console.warn("parseSegments: First segment must be an array with at least 2 elements");
      return [];
    }
    const steps = [];
    let currentX = (_a = segments[0][0]) != null ? _a : 0;
    let currentY = (_b = segments[0][1]) != null ? _b : 0;
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (!Array.isArray(seg)) {
        console.warn(`parseSegments: Segment at index ${i} is not an array, skipping`);
        continue;
      }
      if (seg.length === 2) {
        steps.push({
          type: "line",
          x1: currentX,
          y1: currentY,
          x2: (_c = seg[0]) != null ? _c : 0,
          y2: (_d = seg[1]) != null ? _d : 0,
          col
        });
        currentX = (_e = seg[0]) != null ? _e : 0;
        currentY = (_f = seg[1]) != null ? _f : 0;
      } else if (seg.length === 4) {
        steps.push({
          type: "bezier_quadratic",
          x1: currentX,
          y1: currentY,
          cpx: (_g = seg[0]) != null ? _g : 0,
          cpy: (_h = seg[1]) != null ? _h : 0,
          x2: (_i = seg[2]) != null ? _i : 0,
          y2: (_j = seg[3]) != null ? _j : 0,
          col
        });
        currentX = (_k = seg[2]) != null ? _k : 0;
        currentY = (_l = seg[3]) != null ? _l : 0;
      } else if (seg.length === 6) {
        steps.push({
          type: "bezier_cubic",
          x1: currentX,
          y1: currentY,
          cp1x: (_m = seg[0]) != null ? _m : 0,
          cp1y: (_n = seg[1]) != null ? _n : 0,
          cp2x: (_o = seg[2]) != null ? _o : 0,
          cp2y: (_p = seg[3]) != null ? _p : 0,
          x2: (_q = seg[4]) != null ? _q : 0,
          y2: (_r = seg[5]) != null ? _r : 0,
          col
        });
        currentX = seg[4];
        currentY = seg[5];
      }
    }
    return steps;
  }
  var SHORTHAND_TYPES = {
    "p": "plot",
    "l": "line",
    "pl": "polyline",
    "ml": "polyline",
    // Multi-line alias for polyline: {t:'ml', p:[x1,y1,x2,y2,...], c:0, r:5}
    "r": "rect",
    "rf": "rect_filled",
    "c": "circle",
    "cf": "circle_filled",
    "h": "heart",
    "hf": "heart_filled",
    "sh": "shield",
    "shf": "shield_filled",
    "f": "fill",
    "ff": "flood_fill",
    "s": "sprite",
    "bc": "bezier_cubic",
    "bq": "bezier_quadratic",
    "m": "multi_plot",
    // Multi-plot: {t:'m', c:1, d:[x1,y1,x2,y2,...]}
    "mp": "multi_plot",
    // Alias for multi_plot
    "lg": "linear_gradient",
    // Linear gradient: {t:'lg', x1, y1, x2, y2, stops:[{offset, col},...]}
    "rg": "radial_gradient",
    // Radial gradient: {t:'rg', cx, cy, r, stops:[{offset, col},...]}
    "ps": "path_segments",
    // Compact path segments: {t:'ps', s:[[x,y],[x,y],...], c:0}
    "sp": "sprite_packed",
    // Sprite packed: {t:'sp', x, y, w, h, col, data:"hexstring"}
    "bt": "bitmap_text",
    // Bitmap text: {t:'bt', x, y, text:"hello", col:1, scale:1}
    "flt": "filter"
    // Filter/effect: {t:'flt', effect:'blur'|'sharpen'|'pixelate', ...params}
  };
  function normalizeStep(step) {
    if (!step || typeof step !== "object") return step;
    const normalized = { ...step };
    if (normalized.t !== void 0 && normalized.type === void 0) {
      normalized.type = normalized.t;
      delete normalized.t;
    }
    if (normalized.type && SHORTHAND_TYPES[normalized.type]) {
      normalized.type = SHORTHAND_TYPES[normalized.type];
    }
    if (normalized.type === "path" && normalized.d && typeof normalized.d === "string") {
      normalized._pathString = normalized.d;
      delete normalized.d;
    }
    if (normalized.type === "path_segments") {
      const segments = Array.isArray(normalized.segments) ? normalized.segments : normalized.s;
      if (Array.isArray(segments)) {
        normalized._segments = segments;
        delete normalized.segments;
        delete normalized.s;
      }
    }
    if (normalized.p !== void 0 && normalized.points === void 0) {
      normalized.points = normalized.p;
      delete normalized.p;
    }
    if (normalized.c !== void 0 && normalized.col === void 0) {
      normalized.col = normalized.c;
      delete normalized.c;
    }
    if (normalized.d !== void 0 && normalized.data === void 0) {
      normalized.data = normalized.d;
      delete normalized.d;
    }
    if (normalized.r !== void 0 && normalized.radius === void 0 && normalized.type === "polyline") {
      normalized.radius = normalized.r;
      delete normalized.r;
    }
    if (normalized.type === "bezier_cubic" && Array.isArray(normalized.points)) {
      const p = normalized.points;
      normalized.x1 = p[0];
      normalized.y1 = p[1];
      normalized.cp1x = p[2];
      normalized.cp1y = p[3];
      normalized.cp2x = p[4];
      normalized.cp2y = p[5];
      normalized.x2 = p[6];
      normalized.y2 = p[7];
      delete normalized.points;
    }
    if (normalized.type === "bezier_quadratic" && Array.isArray(normalized.points)) {
      const p = normalized.points;
      normalized.x1 = p[0];
      normalized.y1 = p[1];
      normalized.cpx = p[2];
      normalized.cpy = p[3];
      normalized.x2 = p[4];
      normalized.y2 = p[5];
      delete normalized.points;
    }
    return normalized;
  }
  function resolveSeqItem(spec, seqIndex, options = {}) {
    var _a;
    const strict = options.strict === true;
    if (!spec || !Array.isArray(spec.sequence) || spec.sequence.length === 0) {
      return { frameIndex: 0, fx: false, fy: false, rot: 0, hue: 0, outline: null, mods: [] };
    }
    const sequenceLength = spec.sequence.length;
    const frameLength = Array.isArray(spec.frames) ? spec.frames.length : 0;
    if (!Number.isInteger(seqIndex)) {
      if (strict) {
        throw new Error(`Invalid sequence index: ${seqIndex} (must be an integer in range 0 <= index < ${sequenceLength})`);
      }
      seqIndex = 0;
    }
    const safeIndex = seqIndex;
    const shouldFallback = !strict && (safeIndex < 0 || safeIndex >= sequenceLength);
    if (strict && (safeIndex < 0 || safeIndex >= sequenceLength)) {
      throw new Error(`Invalid sequence index: ${seqIndex} (must be 0 <= index < ${sequenceLength})`);
    }
    const item = sequenceLength > 0 ? spec.sequence[shouldFallback ? 0 : safeIndex] : 0;
    if (typeof item === "object" && item !== null) {
      if (strict && !Object.prototype.hasOwnProperty.call(item, "i")) {
        throw new Error("Sequence item object must include an integer `i` frame index in strict mode");
      }
      if (strict && (typeof item.i !== "number" || !Number.isInteger(item.i))) {
        throw new Error("Sequence item object must include an integer `i` frame index in strict mode");
      }
      if (item.i !== void 0 && item.i < 0) {
        throw new Error(`Invalid sequence frame index: ${item.i}`);
      }
      if (item.i !== void 0 && typeof item.i !== "number") {
        throw new Error("Sequence item `i` must be a frame index number");
      }
      const frameIndex = (_a = item.i) != null ? _a : 0;
      if (strict && (typeof frameIndex !== "number" || !Number.isInteger(frameIndex))) {
        throw new Error("Sequence item object must include an integer `i` frame index in strict mode");
      }
      if (strict && (frameIndex < 0 || frameIndex >= frameLength)) {
        throw new Error(`Sequence item frame index ${frameIndex} is out of range`);
      }
      return {
        frameIndex,
        fx: !!item.fx,
        fy: !!item.fy,
        rot: item.rot || 0,
        hue: item.hue || 0,
        outline: item.outline || null,
        mods: item.mods || []
      };
    }
    if (strict && (typeof item !== "number" || !Number.isInteger(item))) {
      throw new Error(`Invalid sequence item at index ${safeIndex}`);
    }
    if (strict && (item < 0 || item >= frameLength)) {
      throw new Error(`Sequence item frame index ${item} is out of range`);
    }
    return { frameIndex: strict ? item : item || 0, fx: false, fy: false, rot: 0, hue: 0, outline: null, mods: [] };
  }
  var _stepCache = /* @__PURE__ */ new Map();
  var _STEP_CACHE_MAX_ENTRIES = 128;
  function _stepCacheKey(w, h, steps, i) {
    return `${w}x${h}:${JSON.stringify(steps.slice(0, i + 1))}`;
  }
  var DEFAULT_BITMAP_TEXT_FONT_ID = "builtin-5x7";
  var _DEFAULT_ADVANCE_GAP = 1;
  var DEFAULT_FONT_GLYPH_WIDTH = 5;
  var DEFAULT_FONT_GLYPH_HEIGHT = 7;
  var DEFAULT_FONT_LINE_HEIGHT = DEFAULT_FONT_GLYPH_HEIGHT + _DEFAULT_ADVANCE_GAP;
  var DEFAULT_FONT_ADVANCE = DEFAULT_FONT_GLYPH_WIDTH + _DEFAULT_ADVANCE_GAP;
  function clampInt(value, fallback) {
    return Number.isInteger(value) ? value : fallback;
  }
  function normalizeGlyphColumns(columns, glyphHeight) {
    if (!Array.isArray(columns) || columns.length === 0) {
      return [];
    }
    return columns.map((column) => {
      if (!Number.isInteger(column)) {
        return 0;
      }
      return column;
    });
  }
  function buildPlaceholderGlyph(font) {
    const w = clampInt(font.charWidth, DEFAULT_FONT_GLYPH_WIDTH);
    const h = clampInt(font.charHeight, DEFAULT_FONT_GLYPH_HEIGHT);
    const columns = new Array(w);
    if (w === 0 || h === 0) {
      columns[0] = 0;
      return { columns, width: w, height: h, advance: clampInt(font.defaultAdvance, DEFAULT_FONT_ADVANCE) };
    }
    for (let x = 0; x < w; x++) {
      let col = 0;
      for (let y = 0; y < h; y++) {
        if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
          col |= 1 << h - 1 - y;
        }
      }
      columns[x] = col;
    }
    return { columns, width: w, height: h, advance: clampInt(font.defaultAdvance, DEFAULT_FONT_ADVANCE) };
  }
  function normalizeBitmapFontDefinition(fontId, fontSource, options = {}) {
    const fontOffset = Number.isInteger(options.fontOffset) ? options.fontOffset : Number.isInteger(options.baseOffset) ? options.baseOffset : 32;
    const glyphWidth = Number.isInteger(options.glyphWidth) ? options.glyphWidth : DEFAULT_FONT_GLYPH_WIDTH;
    const glyphHeight = Number.isInteger(options.glyphHeight) ? options.glyphHeight : DEFAULT_FONT_GLYPH_HEIGHT;
    const charGap = Number.isInteger(options.charGap) ? options.charGap : _DEFAULT_ADVANCE_GAP;
    const defaultAdvance = Number.isInteger(options.defaultAdvance) ? options.defaultAdvance : Number.isInteger(options.advance) ? options.advance : glyphWidth + charGap;
    const lineHeight = Number.isInteger(options.lineHeight) ? options.lineHeight : glyphHeight + charGap;
    const font = {
      id: fontId,
      byCode: false,
      glyphByCode: null,
      glyphByChar: /* @__PURE__ */ new Map(),
      glyphByCodeMap: null,
      fontOffset,
      charWidth: glyphWidth,
      charHeight: glyphHeight,
      defaultAdvance,
      lineHeight,
      placeholderGlyph: null
    };
    const normalizeValue = (value, width = glyphWidth, height = glyphHeight, advance = defaultAdvance) => {
      if (value == null) return null;
      if (typeof value === "object" && Array.isArray(value.columns)) {
        return {
          columns: normalizeGlyphColumns(value.columns, height),
          width: Number.isInteger(value.width) ? value.width : width,
          height: Number.isInteger(value.height) ? value.height : height,
          advance: Number.isInteger(value.advance) ? value.advance : advance
        };
      }
      if (Array.isArray(value)) {
        return {
          columns: normalizeGlyphColumns(value, height),
          width,
          height,
          advance
        };
      }
      return null;
    };
    const registerByCode = (glyphs, opts = {}) => {
      const byCode = [];
      const count = glyphs.length;
      const chars = opts.chars;
      const charStart = Number.isInteger(opts.fontOffset) ? opts.fontOffset : fontOffset;
      const glyphW = Number.isInteger(opts.glyphWidth) ? opts.glyphWidth : glyphWidth;
      const glyphH = Number.isInteger(opts.glyphHeight) ? opts.glyphHeight : glyphHeight;
      const glyphA = Number.isInteger(opts.defaultAdvance) ? opts.defaultAdvance : defaultAdvance;
      for (let i = 0; i < count; i++) {
        const sourceGlyph = normalizeValue(glyphs[i], glyphW, glyphH, glyphA);
        if (!sourceGlyph) continue;
        const char = chars && chars[i] != null ? String(chars[i]) : String.fromCharCode(charStart + i);
        if (char === "") continue;
        const glyph = { ...sourceGlyph };
        glyph.width = glyph.width || glyphW;
        glyph.height = glyph.height || glyphH;
        glyph.advance = glyph.advance || glyphA;
        byCode[i] = glyph;
        font.glyphByChar.set(char, glyph);
      }
      font.byCode = true;
      font.glyphByCode = byCode;
      font.glyphByCodeMap = null;
      return font;
    };
    const registerByChar = (entries, fallbackAdvance = defaultAdvance) => {
      for (const [char, sourceGlyph] of Object.entries(entries)) {
        const glyph = normalizeValue(
          sourceGlyph,
          Number.isInteger(sourceGlyph == null ? void 0 : sourceGlyph.width) ? sourceGlyph.width : glyphWidth,
          Number.isInteger(sourceGlyph == null ? void 0 : sourceGlyph.height) ? sourceGlyph.height : glyphHeight,
          Number.isInteger(sourceGlyph == null ? void 0 : sourceGlyph.advance) ? sourceGlyph.advance : fallbackAdvance
        );
        if (!glyph || !char) continue;
        const glyphChar = String(char);
        glyph.width = glyph.width || glyphWidth;
        glyph.height = glyph.height || glyphHeight;
        glyph.advance = glyph.advance || fallbackAdvance;
        font.glyphByChar.set(glyphChar, glyph);
      }
      font.byCode = false;
      font.glyphByCode = null;
      font.glyphByCodeMap = null;
      return font;
    };
    const source = fontSource;
    if (Array.isArray(source)) {
      const sourceGlyphs = source.map((entry) => {
        if (entry && entry.imageData && entry.imageData.data) {
          const cols = [];
          const width = Number.isInteger(entry.imageData.width || entry.width) ? entry.imageData.width || entry.width : glyphWidth;
          const height = Number.isInteger(entry.imageData.height || entry.height) ? entry.imageData.height || entry.height : glyphHeight;
          const srcData = entry.imageData.data || [];
          const threshold = Number.isInteger(options.alphaThreshold) ? options.alphaThreshold : 0;
          for (let x = 0; x < width; x++) {
            let column = 0;
            for (let y = 0; y < height; y++) {
              const alpha = srcData[(y * width + x) * 4 + 3];
              if (alpha > threshold) {
                column |= 1 << height - 1 - y;
              }
            }
            cols.push(column);
          }
          return { columns: cols, width, height };
        }
        return entry;
      });
      return registerByCode(sourceGlyphs, {
        chars: options.chars,
        fontOffset: options.fontOffset,
        glyphWidth,
        glyphHeight,
        defaultAdvance
      });
    }
    if (source && typeof source === "object" && source.glyphs) {
      if (Array.isArray(source.glyphs)) {
        return registerByCode(
          source.glyphs,
          {
            chars: source.chars || options.chars,
            fontOffset: Number.isInteger(source.fontOffset) ? source.fontOffset : options.fontOffset,
            glyphWidth: Number.isInteger(source.glyphWidth) ? source.glyphWidth : glyphWidth,
            glyphHeight: Number.isInteger(source.glyphHeight) ? source.glyphHeight : glyphHeight,
            defaultAdvance: Number.isInteger(source.defaultAdvance) ? source.defaultAdvance : defaultAdvance
          }
        );
      }
      if (typeof source.glyphs === "object") {
        registerByChar(source.glyphs, defaultAdvance);
        return font;
      }
    }
    throw new Error("registerBitmapFontAtlas: unsupported font source shape");
  }
  function getBitmapFont(fontId = DEFAULT_BITMAP_TEXT_FONT_ID) {
    return BITMAP_TEXT_FONT_REGISTRY.get(fontId) || null;
  }
  function resolveBitmapFontGlyph(font, char, fontOffsetOverride) {
    if (!font || !char) return null;
    const code = char.codePointAt(0);
    if (font.byCode && font.glyphByCode && Number.isInteger(code)) {
      const offset = Number.isInteger(fontOffsetOverride) ? fontOffsetOverride : font.fontOffset;
      const byCode = font.glyphByCode[code - offset];
      if (byCode) return byCode;
    }
    return font.glyphByChar.get(char) || null;
  }
  function getBitmapTextGlyph(font, char, fontOffsetOverride) {
    const glyph = resolveBitmapFontGlyph(font, char, fontOffsetOverride);
    if (glyph) return glyph;
    if (!font) return null;
    if (!font.placeholderGlyph) {
      font.placeholderGlyph = buildPlaceholderGlyph(font);
    }
    return font.placeholderGlyph;
  }
  var BITMAP_FONT_5X7 = /* @__PURE__ */ (() => {
    const raw = [
      // SP ! " # $ % & ' ( ) * + , - . /
      [0, 0, 0, 0, 0],
      [0, 0, 95, 0, 0],
      [0, 7, 0, 7, 0],
      [20, 127, 20, 127, 20],
      [36, 42, 127, 42, 18],
      [35, 19, 8, 100, 98],
      [54, 73, 85, 34, 80],
      [0, 5, 3, 0, 0],
      [0, 28, 34, 65, 0],
      [0, 65, 34, 28, 0],
      [20, 8, 62, 8, 20],
      [8, 8, 62, 8, 8],
      [0, 80, 48, 0, 0],
      [0, 8, 8, 8, 0],
      [0, 96, 96, 0, 0],
      [32, 16, 8, 4, 2],
      // 0-9
      [62, 81, 73, 69, 62],
      [0, 66, 127, 64, 0],
      [66, 97, 81, 73, 70],
      [33, 65, 69, 75, 49],
      [24, 20, 18, 127, 16],
      [39, 69, 69, 69, 57],
      [60, 74, 73, 73, 48],
      [1, 113, 9, 5, 3],
      [54, 73, 73, 73, 54],
      [6, 73, 73, 41, 30],
      // : ; < = > ? @
      [0, 54, 54, 0, 0],
      [0, 86, 54, 0, 0],
      [8, 20, 34, 65, 0],
      [20, 20, 20, 20, 20],
      [0, 65, 34, 20, 8],
      [2, 1, 81, 9, 6],
      [50, 73, 121, 65, 62],
      // A-Z
      [126, 17, 17, 17, 126],
      [127, 73, 73, 73, 54],
      [62, 65, 65, 65, 34],
      [127, 65, 65, 34, 28],
      [127, 73, 73, 73, 65],
      [127, 9, 9, 9, 1],
      [62, 65, 73, 73, 122],
      [127, 8, 8, 8, 127],
      [0, 65, 127, 65, 0],
      [32, 64, 65, 63, 1],
      [127, 8, 20, 34, 65],
      [127, 64, 64, 64, 64],
      [127, 2, 12, 2, 127],
      [127, 4, 8, 16, 127],
      [62, 65, 65, 65, 62],
      [127, 9, 9, 9, 6],
      [62, 65, 81, 33, 94],
      [127, 9, 25, 41, 70],
      [70, 73, 73, 73, 49],
      [1, 1, 127, 1, 1],
      [63, 64, 64, 64, 63],
      [31, 32, 64, 32, 31],
      [63, 64, 56, 64, 63],
      [99, 20, 8, 20, 99],
      [7, 8, 112, 8, 7],
      [97, 81, 73, 69, 67],
      // [ \ ] ^ _ `
      [0, 127, 65, 65, 0],
      [2, 4, 8, 16, 32],
      [0, 65, 65, 127, 0],
      [4, 2, 1, 2, 4],
      [64, 64, 64, 64, 64],
      [0, 1, 2, 4, 0],
      // a-z
      [32, 84, 84, 84, 120],
      [127, 72, 68, 68, 56],
      [56, 68, 68, 68, 32],
      [56, 68, 68, 72, 127],
      [56, 84, 84, 84, 24],
      [8, 126, 9, 1, 2],
      [12, 82, 82, 82, 62],
      [127, 8, 4, 4, 120],
      [0, 68, 125, 64, 0],
      [32, 64, 68, 61, 0],
      [127, 16, 40, 68, 0],
      [0, 65, 127, 64, 0],
      [124, 4, 24, 4, 124],
      [124, 8, 4, 4, 120],
      [56, 68, 68, 68, 56],
      [124, 20, 20, 20, 8],
      [8, 20, 20, 24, 124],
      [124, 8, 4, 4, 8],
      [72, 84, 84, 84, 32],
      [4, 63, 68, 64, 32],
      [60, 64, 64, 32, 124],
      [28, 32, 64, 32, 28],
      [60, 64, 48, 64, 60],
      [68, 40, 16, 40, 68],
      [12, 80, 80, 80, 60],
      [68, 100, 84, 76, 68],
      // { | } ~
      [0, 8, 54, 65, 0],
      [0, 0, 127, 0, 0],
      [0, 65, 54, 8, 0],
      [16, 8, 8, 16, 8]
    ];
    return raw;
  })();
  var DEFAULT_BITMAP_FONT = normalizeBitmapFontDefinition(DEFAULT_BITMAP_TEXT_FONT_ID, {
    glyphs: BITMAP_FONT_5X7,
    glyphWidth: DEFAULT_FONT_GLYPH_WIDTH,
    glyphHeight: DEFAULT_FONT_GLYPH_HEIGHT,
    defaultAdvance: DEFAULT_FONT_ADVANCE,
    lineHeight: DEFAULT_FONT_LINE_HEIGHT,
    fontOffset: 32
  });
  var BITMAP_TEXT_FONT_REGISTRY = /* @__PURE__ */ new Map([
    [DEFAULT_BITMAP_TEXT_FONT_ID, DEFAULT_BITMAP_FONT]
  ]);
  function renderIndexBuffer(specInput, seqIndex = 0, opts = {}) {
    var _a, _b;
    try {
      const shouldCancel = typeof opts.shouldCancel === "function" ? opts.shouldCancel : null;
      throwIfRenderCancelled(shouldCancel);
      const spec = normalizeSpec(specInput);
      let { w, h } = spec;
      if (typeof w !== "number" || typeof h !== "number" || w <= 0 || h <= 0) {
        throw new Error(`Invalid dimensions: width and height must be positive numbers (got w=${w}, h=${h})`);
      }
      const {
        previewStep = null,
        palette = null,
        seed = null,
        layerProbabilities = {},
        stepCache: useStepCache = false,
        strict = false
      } = opts;
      if (!Number.isInteger(seqIndex)) {
        if (strict) {
          throw new Error(`Invalid sequence index: ${seqIndex}`);
        }
        seqIndex = 0;
      }
      const { frameIndex, fx, fy, rot, hue, outline, mods } = resolveSeqItem(spec, seqIndex, { strict });
      const frame = (_a = spec.frames[frameIndex]) != null ? _a : spec.frames[0];
      if (!frame) {
        throw new Error(`Invalid frame index: ${frameIndex}`);
      }
      let steps = (_b = frame.steps) != null ? _b : [];
      const hasProbability = steps.some(
        (s) => s.probability !== void 0 || s.layer !== void 0 || s.groupProbability !== void 0
      );
      if (hasProbability && seed != null) {
        const rng = createSeededRandom(seed);
        steps = applyProbabilisticSteps(steps, rng, { layerProbabilities });
      }
      let out = new Int32Array(w * h);
      out.fill(-1);
      let _dirtyX1 = Infinity, _dirtyY1 = Infinity, _dirtyX2 = -1, _dirtyY2 = -1;
      const directColorMap = /* @__PURE__ */ new Map();
      const dynamicPaletteColors = [];
      const toRGBA32 = colorValueToInternalRgba32;
      const activeBasePalette = palette || (spec.customPalette ? [...spec.customPalette, ...DEFAULT_PALETTE_RGB24] : DEFAULT_PALETTE_RGB24);
      const directColorToRgb24 = (value) => {
        const rgba32 = colorValueToInternalRgba32(value);
        return (rgba32 >>> 24 & 255) << 16 | (rgba32 >>> 16 & 255) << 8 | rgba32 >>> 8 & 255;
      };
      const resolveCol = (col) => {
        if (col === -1) return -1;
        if (col >= 0 && col <= 255) return col;
        if (directColorMap.has(col)) return directColorMap.get(col);
        const idx = 256 + dynamicPaletteColors.length;
        directColorMap.set(col, idx);
        dynamicPaletteColors.push(toRGBA32(col));
        return idx;
      };
      const blendedColorMap = /* @__PURE__ */ new Map();
      const getColorRGBA = (idx) => {
        if (idx === -1) return null;
        if (idx < 256) {
          const rgb = activeBasePalette[idx] || 0;
          return { r: rgb >> 16 & 255, g: rgb >> 8 & 255, b: rgb & 255, a: 255 };
        }
        const rgba32 = dynamicPaletteColors[idx - 256];
        return {
          r: rgba32 >> 24 & 255,
          g: rgba32 >> 16 & 255,
          b: rgba32 >> 8 & 255,
          a: rgba32 & 255
        };
      };
      const registerBlended = (rgba32) => {
        if (blendedColorMap.has(rgba32)) return blendedColorMap.get(rgba32);
        const idx = 256 + dynamicPaletteColors.length;
        blendedColorMap.set(rgba32, idx);
        dynamicPaletteColors.push(rgba32);
        return idx;
      };
      let _blendMode = "normal";
      const blendChannel = (src, dst, mode) => {
        switch (mode) {
          case "multiply":
            return Math.round(src * dst / 255);
          case "screen":
            return 255 - Math.round((255 - src) * (255 - dst) / 255);
          case "overlay":
            return dst < 128 ? Math.round(2 * src * dst / 255) : 255 - Math.round(2 * (255 - src) * (255 - dst) / 255);
          case "add":
            return Math.min(255, src + dst);
          default:
            return src;
        }
      };
      const setPix = (x, y, col) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const pos = y * w + x;
        if (col === -1) return;
        if (x < _dirtyX1) _dirtyX1 = x;
        if (x > _dirtyX2) _dirtyX2 = x;
        if (y < _dirtyY1) _dirtyY1 = y;
        if (y > _dirtyY2) _dirtyY2 = y;
        if (_blendMode !== "normal") {
          const srcC = getColorRGBA(col);
          if (!srcC || srcC.a === 0) return;
          const existing2 = out[pos];
          const dstC = existing2 === -1 ? { r: 0, g: 0, b: 0, a: 0 } : getColorRGBA(existing2);
          if (!dstC) {
            out[pos] = col;
            return;
          }
          const rB = blendChannel(srcC.r, dstC.r, _blendMode);
          const gB = blendChannel(srcC.g, dstC.g, _blendMode);
          const bB = blendChannel(srcC.b, dstC.b, _blendMode);
          const aB = srcC.a;
          const blended2 = rB << 24 | gB << 16 | bB << 8 | aB | 0;
          out[pos] = registerBlended(blended2);
          return;
        }
        if (col >= 0 && col <= 255) {
          out[pos] = col;
          return;
        }
        const newRGBA32 = dynamicPaletteColors[col - 256];
        const newAlpha = newRGBA32 & 255;
        if (newAlpha === 0) return;
        if (newAlpha === 255) {
          out[pos] = col;
          return;
        }
        const existing = out[pos];
        if (existing === -1) {
          out[pos] = col;
          return;
        }
        const eC = getColorRGBA(existing);
        if (!eC) {
          out[pos] = col;
          return;
        }
        const nR = newRGBA32 >> 24 & 255;
        const nG = newRGBA32 >> 16 & 255;
        const nB = newRGBA32 >> 8 & 255;
        const aNew = newAlpha / 255;
        const aExist = eC.a / 255;
        const aOut = aNew + aExist * (1 - aNew);
        if (aOut === 0) {
          out[pos] = -1;
          return;
        }
        const rOut = Math.round((nR * aNew + eC.r * aExist * (1 - aNew)) / aOut);
        const gOut = Math.round((nG * aNew + eC.g * aExist * (1 - aNew)) / aOut);
        const bOut = Math.round((nB * aNew + eC.b * aExist * (1 - aNew)) / aOut);
        const alphaOut = Math.round(aOut * 255);
        const blended = rOut << 24 | gOut << 16 | bOut << 8 | alphaOut | 0;
        out[pos] = registerBlended(blended);
      };
      const rgbToPaletteIndex = (rgb24, paletteColors) => {
        const r = rgb24 >> 16 & 255;
        const g = rgb24 >> 8 & 255;
        const b = rgb24 & 255;
        let minDist = Infinity;
        let bestIdx = 0;
        for (let i = 0; i < paletteColors.length; i++) {
          const pr = paletteColors[i] >> 16 & 255;
          const pg = paletteColors[i] >> 8 & 255;
          const pb = paletteColors[i] & 255;
          const dist = (r - pr) * (r - pr) + (g - pg) * (g - pg) + (b - pb) * (b - pb);
          if (dist < minDist) {
            minDist = dist;
            bestIdx = i;
          }
        }
        return bestIdx;
      };
      const getGradientColor = (t, colorOrStops, endColorOrFallback) => {
        if (Array.isArray(colorOrStops)) {
          const stops = colorOrStops;
          const fallbackColor = endColorOrFallback;
          if (stops.length === 0) {
            return fallbackColor !== void 0 ? fallbackColor : 0;
          }
          if (stops.length === 1) {
            return stops[0].col !== void 0 ? stops[0].col : fallbackColor;
          }
          let startStop = stops[0];
          let endStop = stops[stops.length - 1];
          for (let i = 0; i < stops.length - 1; i++) {
            if (t >= stops[i].offset && t <= stops[i + 1].offset) {
              startStop = stops[i];
              endStop = stops[i + 1];
              break;
            }
          }
          if (t <= startStop.offset) {
            return startStop.col !== void 0 ? startStop.col : fallbackColor;
          }
          if (t >= endStop.offset) {
            return endStop.col !== void 0 ? endStop.col : fallbackColor;
          }
          const range = endStop.offset - startStop.offset;
          const localT = range > 0 ? (t - startStop.offset) / range : 0;
          const startColor2 = startStop.col !== void 0 ? startStop.col : fallbackColor;
          const endColor2 = endStop.col !== void 0 ? endStop.col : fallbackColor;
          const sr2 = startColor2 >> 16 & 255;
          const sg2 = startColor2 >> 8 & 255;
          const sb2 = startColor2 & 255;
          const er2 = endColor2 >> 16 & 255;
          const eg2 = endColor2 >> 8 & 255;
          const eb2 = endColor2 & 255;
          const r2 = Math.round(sr2 + (er2 - sr2) * localT);
          const g2 = Math.round(sg2 + (eg2 - sg2) * localT);
          const b2 = Math.round(sb2 + (eb2 - sb2) * localT);
          return r2 << 16 | g2 << 8 | b2;
        }
        const startColor = colorOrStops;
        const endColor = endColorOrFallback;
        const sr = startColor >> 16 & 255;
        const sg = startColor >> 8 & 255;
        const sb = startColor & 255;
        const er = endColor >> 16 & 255;
        const eg = endColor >> 8 & 255;
        const eb = endColor & 255;
        const r = Math.round(sr + (er - sr) * t);
        const g = Math.round(sg + (eg - sg) * t);
        const b = Math.round(sb + (eb - sb) * t);
        return r << 16 | g << 8 | b;
      };
      const drawBitmapText = (step, col) => {
        const text = step.text == null ? "" : String(step.text);
        if (!text) return;
        const fontName = typeof step.font === "string" && step.font.trim() ? step.font.trim() : typeof step.fontId === "string" && step.fontId.trim() ? step.fontId.trim() : DEFAULT_BITMAP_TEXT_FONT_ID;
        const font = getBitmapFont(fontName) || getBitmapFont(DEFAULT_BITMAP_TEXT_FONT_ID);
        if (!font) return;
        const scale = Math.max(1, Number.isFinite(step.scale) && step.scale > 0 ? Math.round(step.scale) : 1);
        const stepFontOffset = Number.isInteger(step.fontOffset) ? step.fontOffset : font.fontOffset;
        const glyphLineHeight = Number.isInteger(step.lineHeight) ? step.lineHeight : font.lineHeight;
        const startX = Number.isFinite(step.x) ? Math.floor(step.x) : 0;
        const startY = Number.isFinite(step.y) ? Math.floor(step.y) : 0;
        const advanceScale = Math.max(1, scale);
        const lineGap = Math.max(1, glyphLineHeight) * advanceScale;
        const tracking = Number.isFinite(step.tracking) && step.tracking > 0 ? Math.floor(step.tracking) : 0;
        const boxWidth = Number.isFinite(step.w) && step.w > 0 ? Math.floor(step.w) : null;
        const align = step.align === "center" || step.align === "right" ? step.align : "left";
        const measureLine = (line) => {
          let width = 0;
          let glyphCount = 0;
          for (const ch of line) {
            const glyph = getBitmapTextGlyph(font, ch, stepFontOffset);
            if (!glyph) continue;
            width += Math.max(1, clampInt(glyph.advance, font.defaultAdvance)) * advanceScale;
            glyphCount += 1;
          }
          return Math.max(0, width + Math.max(0, glyphCount - 1) * tracking);
        };
        const lineStartX = (line) => {
          if (!boxWidth || align === "left") return startX;
          const lineWidth = measureLine(line);
          if (align === "center") return startX + Math.floor((boxWidth - lineWidth) / 2);
          return startX + boxWidth - lineWidth;
        };
        const lines = text.split("\n");
        let cy = startY;
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];
          let cx = lineStartX(line);
          for (const ch of line) {
            const glyph = getBitmapTextGlyph(font, ch, stepFontOffset);
            if (!glyph) continue;
            const glyphWidth = Math.max(1, clampInt(glyph.width, font.charWidth));
            const glyphHeight = Math.max(1, clampInt(glyph.height, font.charHeight));
            const glyphAdvance = Math.max(1, clampInt(glyph.advance, font.defaultAdvance));
            const columns = glyph.columns || [];
            for (let gx = 0; gx < glyphWidth; gx++) {
              const bits = gx < columns.length ? columns[gx] : 0;
              if (!bits) continue;
              for (let gy = 0; gy < glyphHeight; gy++) {
                if (bits & 1 << glyphHeight - 1 - gy) {
                  for (let sy = 0; sy < advanceScale; sy++) {
                    for (let sx = 0; sx < advanceScale; sx++) {
                      setPix(cx + gx * advanceScale + sx, cy + gy * advanceScale + sy, col);
                    }
                  }
                }
              }
            }
            cx += glyphAdvance * advanceScale + tracking;
          }
          cy += lineGap;
        }
      };
      const applyBlur = (strength = 1) => {
        const passes = Math.max(1, Math.min(5, Math.round(strength)));
        const getC = (idx) => {
          if (idx < 0 || idx === -1) return null;
          if (idx < 256) {
            const rgb = activeBasePalette[idx] || 0;
            return [rgb >> 16 & 255, rgb >> 8 & 255, rgb & 255];
          }
          const rgba32 = dynamicPaletteColors[idx - 256];
          return [rgba32 >> 24 & 255, rgba32 >> 16 & 255, rgba32 >> 8 & 255];
        };
        for (let pass = 0; pass < passes; pass++) {
          const snapshot = Int32Array.from(out);
          for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
              let rS = 0, gS = 0, bS = 0, count = 0;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const nx = px + dx, ny = py + dy;
                  if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                  const c = getC(snapshot[ny * w + nx]);
                  if (!c) continue;
                  rS += c[0];
                  gS += c[1];
                  bS += c[2];
                  count++;
                }
              }
              if (count === 0) continue;
              const idx = resolveCol(createRgbToken(Math.round(rS / count), Math.round(gS / count), Math.round(bS / count)));
              out[py * w + px] = idx;
            }
          }
        }
      };
      const applySharpen = (strength = 1) => {
        const s = Math.max(0.5, Math.min(4, strength));
        const getC = (idx) => {
          if (idx < 0 || idx === -1) return null;
          if (idx < 256) {
            const rgb = activeBasePalette[idx] || 0;
            return [rgb >> 16 & 255, rgb >> 8 & 255, rgb & 255];
          }
          const rgba32 = dynamicPaletteColors[idx - 256];
          return [rgba32 >> 24 & 255, rgba32 >> 16 & 255, rgba32 >> 8 & 255];
        };
        const snapshot = Int32Array.from(out);
        for (let py = 0; py < h; py++) {
          for (let px = 0; px < w; px++) {
            const origC = getC(snapshot[py * w + px]);
            if (!origC) continue;
            let rS = 0, gS = 0, bS = 0, count = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = px + dx, ny = py + dy;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                const c = getC(snapshot[ny * w + nx]);
                if (!c) continue;
                rS += c[0];
                gS += c[1];
                bS += c[2];
                count++;
              }
            }
            if (count === 0) continue;
            const rB = rS / count, gB = gS / count, bB = bS / count;
            const rO = Math.min(255, Math.max(0, Math.round(origC[0] + s * (origC[0] - rB))));
            const gO = Math.min(255, Math.max(0, Math.round(origC[1] + s * (origC[1] - gB))));
            const bO = Math.min(255, Math.max(0, Math.round(origC[2] + s * (origC[2] - bB))));
            out[py * w + px] = resolveCol(createRgbToken(rO, gO, bO));
          }
        }
      };
      const applyPixelate = (blockSize = 2) => {
        const bs = Math.max(2, Math.min(32, Math.round(blockSize)));
        const snapshot = Int32Array.from(out);
        for (let by = 0; by < h; by += bs) {
          for (let bx = 0; bx < w; bx += bs) {
            const freq = /* @__PURE__ */ new Map();
            let bestIdx = snapshot[by * w + bx], bestFreq = 0;
            for (let dy = 0; dy < bs && by + dy < h; dy++) {
              for (let dx = 0; dx < bs && bx + dx < w; dx++) {
                const v = snapshot[(by + dy) * w + (bx + dx)];
                const f = (freq.get(v) || 0) + 1;
                freq.set(v, f);
                if (f > bestFreq) {
                  bestFreq = f;
                  bestIdx = v;
                }
              }
            }
            for (let dy = 0; dy < bs && by + dy < h; dy++) {
              for (let dx = 0; dx < bs && bx + dx < w; dx++) {
                out[(by + dy) * w + (bx + dx)] = bestIdx;
              }
            }
          }
        }
      };
      const getHeartPoints = (cx, cy, rx, ry, filled) => {
        const STEPS = Math.max(1440, rx * 40, ry * 40);
        const NY_BOTTOM = -17;
        const NY_TOP = 12.2;
        const nyRange = NY_TOP - NY_BOTTOM;
        const boundMinY = Math.floor(cy - ry);
        const boundMaxY = Math.floor(cy + ry) - 2;
        const samples = [];
        for (let i = 0; i <= STEPS; i++) {
          const t = i / STEPS * Math.PI * 2;
          const nx = 16 * Math.pow(Math.sin(t), 3);
          const ny = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          samples.push([
            cx + nx / 16 * rx,
            cy + ry - (ny - NY_BOTTOM) / nyRange * (2 * ry)
          ]);
        }
        let minY = Infinity, maxY = -Infinity;
        for (const [, py] of samples) {
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
        minY = Math.max(boundMinY, Math.round(minY));
        maxY = Math.min(boundMaxY, Math.round(maxY));
        const insideSet = /* @__PURE__ */ new Set();
        for (let y = minY; y <= maxY; y++) {
          const crossings = [];
          const yc = y + 0.5;
          for (let i = 0; i < STEPS; i++) {
            const [x1, y1] = samples[i];
            const [x2, y2] = samples[i + 1];
            if (y1 <= yc && y2 > yc || y2 <= yc && y1 > yc) {
              const frac = (yc - y1) / (y2 - y1);
              crossings.push(x1 + frac * (x2 - x1));
            }
          }
          crossings.sort((a, b) => a - b);
          for (let k = 0; k + 1 < crossings.length; k += 2) {
            for (let x = Math.ceil(crossings[k]); x <= Math.floor(crossings[k + 1]); x++) {
              insideSet.add(`${x},${y}`);
            }
          }
        }
        let actualMaxY = boundMinY;
        for (const key of insideSet) {
          const y = parseInt(key.split(",")[1]);
          if (y > actualMaxY) actualMaxY = y;
        }
        const bottomRowPixels = [...insideSet].filter((k) => k.endsWith(`,${actualMaxY}`)).map((k) => parseInt(k.split(",")[0]));
        if (bottomRowPixels.length !== 1) {
          for (const key of [...insideSet]) {
            if (key.endsWith(`,${actualMaxY}`)) {
              insideSet.delete(key);
            }
          }
          const centerX = Math.floor(cx);
          insideSet.add(`${centerX},${actualMaxY}`);
        }
        if (filled) {
          const result3 = [];
          for (const key of insideSet) result3.push(key.split(",").map(Number));
          return result3;
        }
        const result2 = [];
        for (const key of insideSet) {
          const [px, py] = key.split(",").map(Number);
          if (!insideSet.has(`${px - 1},${py}`) || !insideSet.has(`${px + 1},${py}`) || !insideSet.has(`${px},${py - 1}`) || !insideSet.has(`${px},${py + 1}`)) {
            result2.push([px, py]);
          }
        }
        return result2;
      };
      const getShieldPoints = (cx, cy, rx, ry, filled) => {
        const STEPS = Math.max(1440, rx * 40, ry * 40);
        const NY_BOTTOM = -17;
        const NY_TOP = 12.2;
        const nyRange = NY_TOP - NY_BOTTOM;
        const boundMinY = Math.floor(cy - ry);
        const boundMaxY = Math.floor(cy + ry) - 2;
        const rowMin = /* @__PURE__ */ new Map();
        const rowMax = /* @__PURE__ */ new Map();
        for (let i = 0; i < STEPS; i++) {
          const t = i / STEPS * Math.PI * 2;
          const nx = 16 * Math.pow(Math.sin(t), 3);
          const ny = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          const px = Math.round(cx + nx / 16 * rx);
          let py = Math.round(cy + ry - (ny - NY_BOTTOM) / nyRange * (2 * ry));
          if (py < boundMinY || py > boundMaxY) continue;
          if (!rowMin.has(py) || px < rowMin.get(py)) rowMin.set(py, px);
          if (!rowMax.has(py) || px > rowMax.get(py)) rowMax.set(py, px);
        }
        let actualMaxY = boundMinY;
        for (const py of rowMin.keys()) {
          if (py > actualMaxY) actualMaxY = py;
        }
        const hasBottomRow = rowMin.has(actualMaxY);
        const bottomMinX = hasBottomRow ? rowMin.get(actualMaxY) : 0;
        const bottomMaxX = hasBottomRow ? rowMax.get(actualMaxY) : 0;
        const bottomWidth = hasBottomRow ? bottomMaxX - bottomMinX + 1 : 0;
        const centerX = Math.floor(cx);
        const widthPixels = Math.round(rx * 2);
        const isEvenWidth = widthPixels % 2 === 0;
        if (!hasBottomRow || bottomWidth > 2 || bottomWidth === 2 && !isEvenWidth) {
          if (isEvenWidth) {
            rowMin.set(actualMaxY, centerX - 1);
            rowMax.set(actualMaxY, centerX);
          } else {
            rowMin.set(actualMaxY, centerX);
            rowMax.set(actualMaxY, centerX);
          }
        }
        if (filled) {
          const result3 = [];
          for (const [py, minX] of rowMin) {
            const maxX = rowMax.get(py);
            for (let px = minX; px <= maxX; px++) result3.push([px, py]);
          }
          return result3;
        }
        const insideSet = /* @__PURE__ */ new Set();
        for (const [py, minX] of rowMin) {
          const maxX = rowMax.get(py);
          for (let px = minX; px <= maxX; px++) insideSet.add(`${px},${py}`);
        }
        const result2 = [];
        for (const key of insideSet) {
          const [px, py] = key.split(",").map(Number);
          if (!insideSet.has(`${px - 1},${py}`) || !insideSet.has(`${px + 1},${py}`) || !insideSet.has(`${px},${py - 1}`) || !insideSet.has(`${px},${py + 1}`)) {
            result2.push([px, py]);
          }
        }
        return result2;
      };
      const runStep = (step) => {
        var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
        throwIfRenderCancelled(shouldCancel);
        if (!step) return;
        const strictFail = (message) => {
          if (strict) throw new Error(message);
        };
        step = normalizeStep(step);
        if (!step.type) return;
        const prevBlendMode = _blendMode;
        if (step.blendMode && typeof step.blendMode === "string") {
          _blendMode = step.blendMode;
        }
        try {
          const col = resolveCol(step.col !== void 0 ? step.col : 0);
          if (step.type === "bitmap_text") {
            drawBitmapText(step, col);
            return;
          }
          if (step.type === "filter") {
            const effect = step.effect || "";
            if (effect === "blur") applyBlur(step.strength);
            else if (effect === "sharpen") applySharpen(step.strength);
            else if (effect === "pixelate") applyPixelate(step.blockSize);
            _dirtyX1 = 0;
            _dirtyY1 = 0;
            _dirtyX2 = w - 1;
            _dirtyY2 = h - 1;
            return;
          }
          if (step.type === "fill") {
            out.fill(col);
            _dirtyX1 = 0;
            _dirtyY1 = 0;
            _dirtyX2 = w - 1;
            _dirtyY2 = h - 1;
            return;
          }
          if (step.type === "flood_fill") {
            const sx = step.x | 0;
            const sy = step.y | 0;
            if (sx < 0 || sx >= w || sy < 0 || sy >= h) {
              strictFail("flood_fill start point is out of bounds");
              return;
            }
            const targetCol = out[sy * w + sx];
            if (targetCol === col) return;
            const stack = [sx, sy];
            while (stack.length > 0) {
              const cy = stack.pop();
              const cx = stack.pop();
              if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
              const pos = cy * w + cx;
              if (out[pos] !== targetCol) continue;
              setPix(cx, cy, col);
              stack.push(cx - 1, cy, cx + 1, cy, cx, cy - 1, cx, cy + 1);
            }
            return;
          }
          if (step.type === "plot") {
            setPix((_a2 = step.x) != null ? _a2 : 0, (_b2 = step.y) != null ? _b2 : 0, col);
            return;
          }
          if (step.type === "multi_plot") {
            let data = step.data;
            if ((!data || !Array.isArray(data)) && step.packed) {
              const packedWidth = step.packedWidth || step.pw || step.width || step.w || step.size || Math.max(w, h);
              const packedHeight = step.packedHeight || step.ph || step.height || step.h || step.size || packedWidth;
              data = decompressMultiPlot(step.packed, packedWidth, packedHeight);
              if (!data && !step.size) {
                const hexStr = decompressHex(step.packed);
                const inferredSize = Math.floor(Math.sqrt(hexStr.length * 4));
                if (inferredSize > 0 && inferredSize * inferredSize === hexStr.length * 4) {
                  data = decompressMultiPlot(step.packed, inferredSize);
                  if (data) {
                    console.warn(
                      `[grout] packed multi_plot: size field missing. Canvas is ${w}\xD7${h} but packed data is ${inferredSize}\xD7${inferredSize}. Add size:${inferredSize} to the step to silence this warning.`
                    );
                  }
                }
              }
            }
            if (!data || !Array.isArray(data)) {
              strictFail("multi_plot step is missing coordinate data");
              return;
            }
            const pairCount = Math.floor(data.length / 2);
            for (let i = 0; i < pairCount; i++) {
              setPix(data[i * 2], data[i * 2 + 1], col);
            }
            return;
          }
          if (step.type === "line") {
            let { x1, y1, x2, y2 } = step;
            let dx = Math.abs(x2 - x1);
            let dy = Math.abs(y2 - y1);
            let sx = x1 < x2 ? 1 : -1;
            let sy = y1 < y2 ? 1 : -1;
            let err = dx - dy;
            let safe = 0;
            while (safe++ < 2e3) {
              setPix(x1, y1, col);
              if (x1 === x2 && y1 === y2) break;
              const e2 = 2 * err;
              if (e2 > -dy) {
                err -= dy;
                x1 += sx;
              }
              if (e2 < dx) {
                err += dx;
                y1 += sy;
              }
            }
            return;
          }
          if (step.type === "polyline") {
            const points = step.points || [];
            const radius = step.radius || 0;
            const MIN_POLYLINE_POINTS = 4;
            const MAX_LINE_ITERATIONS = 2e3;
            if (points.length < MIN_POLYLINE_POINTS) return;
            const drawLine = (x1, y1, x2, y2) => {
              x1 = Math.round(x1);
              y1 = Math.round(y1);
              x2 = Math.round(x2);
              y2 = Math.round(y2);
              let dx = Math.abs(x2 - x1);
              let dy = Math.abs(y2 - y1);
              let sx = x1 < x2 ? 1 : -1;
              let sy = y1 < y2 ? 1 : -1;
              let err = dx - dy;
              let safe = 0;
              while (safe++ < MAX_LINE_ITERATIONS) {
                setPix(x1, y1, col);
                if (x1 === x2 && y1 === y2) break;
                const e2 = 2 * err;
                if (e2 > -dy) {
                  err -= dy;
                  x1 += sx;
                }
                if (e2 < dx) {
                  err += dx;
                  y1 += sy;
                }
              }
            };
            const drawQuadBezier = (x1, y1, cpx, cpy, x2, y2) => {
              const segments = Math.min(20, Math.max(5, Math.ceil(radius / 2)));
              let prevX = Math.round(x1);
              let prevY = Math.round(y1);
              for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const mt = 1 - t;
                const curX = Math.round(mt * mt * x1 + 2 * mt * t * cpx + t * t * x2);
                const curY = Math.round(mt * mt * y1 + 2 * mt * t * cpy + t * t * y2);
                drawLine(prevX, prevY, curX, curY);
                prevX = curX;
                prevY = curY;
              }
            };
            if (radius <= 0) {
              for (let i = 0; i < points.length - 2; i += 2) {
                drawLine(points[i], points[i + 1], points[i + 2], points[i + 3]);
              }
              return;
            }
            for (let i = 0; i < points.length - 2; i += 2) {
              const x1 = points[i];
              const y1 = points[i + 1];
              const x2 = points[i + 2];
              const y2 = points[i + 3];
              const dx = x2 - x1;
              const dy = y2 - y1;
              const segLen = Math.sqrt(dx * dx + dy * dy);
              const effectiveRadius = Math.min(radius, segLen / 2);
              const nx = segLen > 0 ? dx / segLen : 0;
              const ny = segLen > 0 ? dy / segLen : 0;
              let startX = x1, startY = y1;
              let endX = x2, endY = y2;
              if (i > 0 && effectiveRadius > 0) {
                startX = x1 + nx * effectiveRadius;
                startY = y1 + ny * effectiveRadius;
              }
              if (i < points.length - 4 && effectiveRadius > 0) {
                endX = x2 - nx * effectiveRadius;
                endY = y2 - ny * effectiveRadius;
              }
              drawLine(startX, startY, endX, endY);
              if (i < points.length - 4 && effectiveRadius > 0) {
                const x3 = points[i + 4];
                const y3 = points[i + 5];
                const dx2 = x3 - x2;
                const dy2 = y3 - y2;
                const segLen2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                const effectiveRadius2 = Math.min(radius, segLen2 / 2);
                const nx2 = segLen2 > 0 ? dx2 / segLen2 : 0;
                const ny2 = segLen2 > 0 ? dy2 / segLen2 : 0;
                const cornerStartX = endX;
                const cornerStartY = endY;
                const cornerEndX = x2 + nx2 * effectiveRadius2;
                const cornerEndY = y2 + ny2 * effectiveRadius2;
                drawQuadBezier(cornerStartX, cornerStartY, x2, y2, cornerEndX, cornerEndY);
              }
            }
            return;
          }
          if (step.type === "bezier_cubic") {
            const { x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2 } = step;
            const segments = step.segments || 20;
            let prevX = Math.round(x1);
            let prevY = Math.round(y1);
            for (let i = 1; i <= segments; i++) {
              const t = i / segments;
              const u = 1 - t;
              const px = u * u * u * x1 + 3 * u * u * t * cp1x + 3 * u * t * t * cp2x + t * t * t * x2;
              const py = u * u * u * y1 + 3 * u * u * t * cp1y + 3 * u * t * t * cp2y + t * t * t * y2;
              const currentX = Math.round(px);
              const currentY = Math.round(py);
              let dx = Math.abs(currentX - prevX);
              let dy = Math.abs(currentY - prevY);
              let sx = prevX < currentX ? 1 : -1;
              let sy = prevY < currentY ? 1 : -1;
              let err = dx - dy;
              let x = prevX;
              let y = prevY;
              let safe = 0;
              while (safe++ < 2e3) {
                setPix(x, y, col);
                if (x === currentX && y === currentY) break;
                const e2 = 2 * err;
                if (e2 > -dy) {
                  err -= dy;
                  x += sx;
                }
                if (e2 < dx) {
                  err += dx;
                  y += sy;
                }
              }
              prevX = currentX;
              prevY = currentY;
            }
            return;
          }
          if (step.type === "bezier_quadratic") {
            const { x1, y1, cpx, cpy, x2, y2 } = step;
            const segments = step.segments || 15;
            let prevX = Math.round(x1);
            let prevY = Math.round(y1);
            for (let i = 1; i <= segments; i++) {
              const t = i / segments;
              const u = 1 - t;
              const px = u * u * x1 + 2 * u * t * cpx + t * t * x2;
              const py = u * u * y1 + 2 * u * t * cpy + t * t * y2;
              const currentX = Math.round(px);
              const currentY = Math.round(py);
              let dx = Math.abs(currentX - prevX);
              let dy = Math.abs(currentY - prevY);
              let sx = prevX < currentX ? 1 : -1;
              let sy = prevY < currentY ? 1 : -1;
              let err = dx - dy;
              let x = prevX;
              let y = prevY;
              let safe = 0;
              while (safe++ < 2e3) {
                setPix(x, y, col);
                if (x === currentX && y === currentY) break;
                const e2 = 2 * err;
                if (e2 > -dy) {
                  err -= dy;
                  x += sx;
                }
                if (e2 < dx) {
                  err += dx;
                  y += sy;
                }
              }
              prevX = currentX;
              prevY = currentY;
            }
            return;
          }
          if (step.type.includes("rect")) {
            const rx = (_c = step.x) != null ? _c : 0, ry = (_d = step.y) != null ? _d : 0, rw = step.w, rh = step.h;
            for (let y = ry; y < ry + rh; y++) {
              for (let x = rx; x < rx + rw; x++) {
                const edge = x === rx || x === rx + rw - 1 || y === ry || y === ry + rh - 1;
                if (step.type === "rect_filled" || edge) setPix(x, y, col);
              }
            }
            return;
          }
          if (step.type === "circle") {
            const rx = step.w / 2;
            const ry = step.h / 2;
            if (rx <= 0 || ry <= 0) return;
            const stepX = (_e = step.x) != null ? _e : 0, stepY = (_f = step.y) != null ? _f : 0;
            const centerX = stepX + rx - 0.5;
            const centerY = stepY + ry - 0.5;
            const rxSq = rx * rx;
            const rySq = ry * ry;
            const isInside = (px, py) => {
              const dx = px - centerX;
              const dy = py - centerY;
              return dx * dx / rxSq + dy * dy / rySq <= 1;
            };
            for (let y = Math.floor(stepY); y < stepY + step.h; y++) {
              for (let x = Math.floor(stepX); x < stepX + step.w; x++) {
                if (isInside(x, y)) {
                  if (!isInside(x, y - 1) || !isInside(x, y + 1) || !isInside(x - 1, y) || !isInside(x + 1, y)) {
                    setPix(x, y, col);
                  }
                }
              }
            }
            return;
          }
          if (step.type === "circle_filled") {
            const rx = step.w / 2;
            const ry = step.h / 2;
            if (rx <= 0 || ry <= 0) return;
            const stepX = (_g = step.x) != null ? _g : 0, stepY = (_h = step.y) != null ? _h : 0;
            const centerX = stepX + rx - 0.5;
            const centerY = stepY + ry - 0.5;
            const rxSq = rx * rx;
            const rySq = ry * ry;
            for (let y = Math.floor(stepY); y < stepY + step.h; y++) {
              for (let x = Math.floor(stepX); x < stepX + step.w; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                if (dx * dx / rxSq + dy * dy / rySq <= 1) {
                  setPix(x, y, col);
                }
              }
            }
            return;
          }
          if (step.type === "heart" || step.type === "heart_filled") {
            const sx = (_i = step.x) != null ? _i : 0;
            const sy = (_j = step.y) != null ? _j : 0;
            const sw = Math.max(1, (_k = step.w) != null ? _k : 1);
            const sh = Math.max(1, (_l = step.h) != null ? _l : 1);
            const filled = step.type === "heart_filled";
            const cx = sx + sw / 2;
            const cy = sy + sh / 2;
            const rx = sw / 2;
            const ry = sh / 2;
            const pts = getHeartPoints(cx, cy, rx, ry, filled);
            for (const [px, py] of pts) setPix(px, py, col);
            return;
          }
          if (step.type === "shield" || step.type === "shield_filled") {
            const sx = (_m = step.x) != null ? _m : 0;
            const sy = (_n = step.y) != null ? _n : 0;
            const sw = Math.max(1, (_o = step.w) != null ? _o : 1);
            const sh = Math.max(1, (_p = step.h) != null ? _p : 1);
            const filled = step.type === "shield_filled";
            const cx = sx + sw / 2;
            const cy = sy + sh / 2;
            const rx = sw / 2;
            const ry = sh / 2;
            const pts = getShieldPoints(cx, cy, rx, ry, filled);
            for (const [px, py] of pts) setPix(px, py, col);
            return;
          }
          if (step.type === "gradient") {
            const { x1 = 0, y1 = 0, x2 = w - 1, y2 = h - 1, colStart, colEnd, stops: gradientStops, steps: stepCount } = step;
            const paletteColors = palette || spec.palette || activeBasePalette;
            const useMultiStop = gradientStops && Array.isArray(gradientStops) && gradientStops.length > 0;
            if (useMultiStop && gradientStops.length === 0) {
              return;
            }
            let startRgb, endRgb, stops;
            if (useMultiStop) {
              stops = gradientStops.map((stop) => {
                let stopColor = stop.col;
                if (typeof stopColor === "number" && stopColor >= 0 && stopColor < paletteColors.length) {
                  stopColor = paletteColors[stopColor];
                } else if (typeof stopColor === "number") {
                  stopColor = directColorToRgb24(stopColor);
                }
                return { offset: stop.offset, col: stopColor };
              });
            } else {
              if (typeof colStart === "number" && colStart >= 0 && colStart < paletteColors.length) {
                startRgb = paletteColors[colStart];
              } else {
                startRgb = directColorToRgb24(colStart);
              }
              if (typeof colEnd === "number" && colEnd >= 0 && colEnd < paletteColors.length) {
                endRgb = paletteColors[colEnd];
              } else {
                endRgb = directColorToRgb24(colEnd);
              }
            }
            const dx = x2 - x1;
            const dy = y2 - y1;
            const gradientLength = Math.sqrt(dx * dx + dy * dy);
            if (gradientLength === 0) {
              const fillColor = useMultiStop ? stops[0].col !== void 0 ? stops[0].col : 0 : startRgb;
              const idx = rgbToPaletteIndex(fillColor, paletteColors);
              for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                  setPix(x, y, idx);
                }
              }
              return;
            }
            const useSteps = stepCount !== void 0 && stepCount > 0;
            let effectiveSteps = stepCount;
            if (useSteps) {
              const maxSteps = Math.floor(gradientLength);
              effectiveSteps = Math.min(stepCount, maxSteps);
              effectiveSteps = Math.max(1, effectiveSteps);
            }
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const vx = x - x1;
                const vy = y - y1;
                const projection = (vx * dx + vy * dy) / (gradientLength * gradientLength);
                let t = Math.max(0, Math.min(1, projection));
                if (useSteps) {
                  const stepIndex = Math.floor(t * effectiveSteps);
                  t = (stepIndex + 0.5) / effectiveSteps;
                  t = Math.max(0, Math.min(1, t));
                }
                const rgb24 = useMultiStop ? getGradientColor(t, stops, 0) : getGradientColor(t, startRgb, endRgb);
                const idx = rgbToPaletteIndex(rgb24, paletteColors);
                setPix(x, y, idx);
              }
            }
            return;
          }
          if (step.type === "sprite") {
            const { x = 0, y = 0, w: sw, h: sh, data } = step;
            if (!Number.isInteger(sw) || !Number.isInteger(sh) || sw <= 0 || sh <= 0 || !data || !Array.isArray(data)) {
              strictFail("sprite step requires positive w/h and array data");
              return;
            }
            if (data.length < sw * sh) {
              strictFail("sprite step data length is too short for sprite dimensions");
              if (!strict) {
                return;
              }
            }
            const dataLen = data.length;
            for (let py = 0; py < sh; py++) {
              for (let px = 0; px < sw; px++) {
                const idx = py * sw + px;
                if (idx >= dataLen) return;
                const colIdx = data[idx];
                if (colIdx !== -1) setPix(x + px, y + py, resolveCol(colIdx));
              }
            }
            return;
          }
          if (step.type === "sprite_packed") {
            const { x = 0, y = 0, w: sw, h: sh, col: col2, data } = step;
            if (!Number.isInteger(sw) || !Number.isInteger(sh) || sw <= 0 || sh <= 0) {
              strictFail("sprite_packed step requires positive w/h");
              return;
            }
            if (typeof data !== "string" || data.length === 0) {
              strictFail("sprite_packed step requires packed data");
              return;
            }
            const totalPixels = sw * sh;
            const hexLen = Math.ceil(totalPixels / 4);
            const paddedHex = (data || "").padEnd(hexLen, "0").slice(0, hexLen);
            const bits = unpackBits(paddedHex, hexLen * 4);
            if (!bits) {
              strictFail("sprite_packed step contains invalid packed data");
              return;
            }
            for (let py = 0; py < sh; py++) {
              for (let px = 0; px < sw; px++) {
                const idx = py * sw + px;
                if (idx >= totalPixels) break;
                if (bits[idx] === 1) setPix(x + px, y + py, col2 != null ? col2 : 1);
              }
            }
            return;
          }
          if (step.type === "linear_gradient") {
            const { x1, y1, x2, y2, stops } = step;
            if (!Array.isArray(stops) || stops.length === 0) {
              strictFail("linear_gradient step requires a non-empty stops array");
              return;
            }
            const dx = x2 - x1;
            const dy = y2 - y1;
            const gradientLength = Math.sqrt(dx * dx + dy * dy);
            if (gradientLength === 0) {
              const firstColor = stops[0].col !== void 0 ? stops[0].col : col;
              out.fill(firstColor);
              return;
            }
            const ndx = dx / gradientLength;
            const ndy = dy / gradientLength;
            for (let py = 0; py < h; py++) {
              for (let px = 0; px < w; px++) {
                const vx = px - x1;
                const vy = py - y1;
                const projection = vx * ndx + vy * ndy;
                let offset = projection / gradientLength;
                offset = Math.max(0, Math.min(1, offset));
                const color = getGradientColor(offset, stops, col);
                setPix(px, py, color);
              }
            }
            return;
          }
          if (step.type === "radial_gradient") {
            const { cx, cy, r, stops } = step;
            if (!Array.isArray(stops) || stops.length === 0) {
              strictFail("radial_gradient step requires a non-empty stops array");
              return;
            }
            if (r <= 0) {
              const firstColor = stops[0].col !== void 0 ? stops[0].col : col;
              out.fill(firstColor);
              return;
            }
            for (let py = 0; py < h; py++) {
              for (let px = 0; px < w; px++) {
                const distX = px - cx;
                const distY = py - cy;
                const distance = Math.sqrt(distX * distX + distY * distY);
                let offset = distance / r;
                offset = Math.max(0, Math.min(1, offset));
                const color = getGradientColor(offset, stops, col);
                setPix(px, py, color);
              }
            }
            return;
          }
          if (step.type === "path" && step._pathString) {
            const pathSteps = parsePathString(step._pathString, col);
            for (const pathStep of pathSteps) {
              runStep(pathStep);
            }
            return;
          }
          if (step.type === "path_segments" && step._segments) {
            const segmentSteps = parseSegments(step._segments, col);
            for (const segStep of segmentSteps) {
              runStep(segStep);
            }
            return;
          }
          strictFail(`Unrecognized step type "${step.type}"`);
        } finally {
          _blendMode = prevBlendMode;
        }
      };
      let startStep = 0;
      if (useStepCache && steps.length > 0 && !hasProbability) {
        for (let k = steps.length - 1; k >= 0; k--) {
          const cacheKey = _stepCacheKey(w, h, steps, k);
          const cached = _stepCache.get(cacheKey);
          if (cached) {
            out.set(cached.out);
            for (const [col, idx] of cached.directColorMap) directColorMap.set(col, idx);
            dynamicPaletteColors.push(...cached.dynamicPaletteColors);
            for (const [rgba, idx] of cached.blendedColorMap) blendedColorMap.set(rgba, idx);
            startStep = k + 1;
            break;
          }
        }
      }
      for (let i = startStep; i < steps.length; i++) {
        try {
          throwIfRenderCancelled(shouldCancel);
          runStep(steps[i]);
        } catch (error) {
          if (strict || (error == null ? void 0 : error.code) === "ERR_RENDER_CANCELLED") throw error;
          console.warn(`Error rendering step ${i}:`, error.message, steps[i]);
        }
        if (useStepCache && !hasProbability) {
          const cacheKey = _stepCacheKey(w, h, steps, i);
          if (!_stepCache.has(cacheKey)) {
            if (_stepCache.size >= _STEP_CACHE_MAX_ENTRIES) {
              _stepCache.delete(_stepCache.keys().next().value);
            }
            _stepCache.set(cacheKey, {
              out: new Int32Array(out),
              directColorMap: new Map(directColorMap),
              dynamicPaletteColors: [...dynamicPaletteColors],
              blendedColorMap: new Map(blendedColorMap)
            });
          }
        }
      }
      if (previewStep) {
        try {
          throwIfRenderCancelled(shouldCancel);
          runStep(previewStep);
        } catch (error) {
          if (strict || (error == null ? void 0 : error.code) === "ERR_RENDER_CANCELLED") throw error;
          console.warn("Error rendering preview step:", error.message);
        }
      }
      let currentW = w;
      let currentH = h;
      let totalHueShift = hue;
      if (mods && mods.length > 0) {
        for (const mod of mods) {
          throwIfRenderCancelled(shouldCancel);
          const parsed = parseModifier(mod);
          if (!parsed) continue;
          switch (parsed.type) {
            case "fx":
              out = flipBuffer(out, currentW, currentH, true, false);
              break;
            case "fy":
              out = flipBuffer(out, currentW, currentH, false, true);
              break;
            case "rot":
              const rotResult = rotateBuffer(out, currentW, currentH, parsed.value);
              out = rotResult.buffer;
              currentW = rotResult.w;
              currentH = rotResult.h;
              break;
            case "hue":
              totalHueShift += parsed.value;
              break;
            case "outline":
              out = outlineBuffer(out, currentW, currentH, parsed.value.color, parsed.value.thickness);
              break;
          }
        }
      } else {
        throwIfRenderCancelled(shouldCancel);
        if (fx || fy) {
          out = flipBuffer(out, currentW, currentH, fx, fy);
        }
        if (rot && rot !== 0) {
          const rotResult = rotateBuffer(out, currentW, currentH, rot);
          out = rotResult.buffer;
          currentW = rotResult.w;
          currentH = rotResult.h;
        }
        if (outline) {
          const outlineColor = typeof outline === "object" && outline.color !== void 0 ? outline.color : 0;
          const outlineThickness = typeof outline === "object" && outline.thickness !== void 0 ? outline.thickness : 1;
          out = outlineBuffer(out, currentW, currentH, outlineColor, outlineThickness);
        }
      }
      const basePalette = (palette || (spec.customPalette ? [...spec.customPalette, ...DEFAULT_PALETTE_RGB24] : DEFAULT_PALETTE_RGB24)).slice(0, 256);
      let resultPalette;
      const hasDirectColors = dynamicPaletteColors.length > 0;
      if (totalHueShift !== 0) {
        resultPalette = shiftPaletteHue(basePalette, totalHueShift);
        if (hasDirectColors) {
          resultPalette = [...resultPalette, ...dynamicPaletteColors];
        }
      } else if (hasDirectColors) {
        resultPalette = [...basePalette, ...dynamicPaletteColors];
      }
      const result = {
        buffer: out,
        w: currentW,
        h: currentH,
        dirtyRect: _dirtyX2 >= 0 ? { x: _dirtyX1, y: _dirtyY1, w: _dirtyX2 - _dirtyX1 + 1, h: _dirtyY2 - _dirtyY1 + 1 } : { x: 0, y: 0, w: 0, h: 0 }
      };
      if (resultPalette || spec.customPalette) {
        result.palette = resultPalette || basePalette;
      }
      return result;
    } catch (error) {
      const wrapped = new Error(`Rendering failed: ${error.message}`);
      if (error && error.code) wrapped.code = error.code;
      throw wrapped;
    }
  }
  var MAX_RGBA_ATLAS_PIXELS = 16777216;
  function throwIfAtlasCancelled(shouldCancel) {
    if (typeof shouldCancel === "function" && shouldCancel()) {
      const error = new Error("Render job cancelled");
      error.code = "ERR_RENDER_CANCELLED";
      throw error;
    }
  }
  function assertPositiveInt(value, name, max = 4096) {
    if (!Number.isInteger(value) || value <= 0 || value > max) {
      throw new Error(`${name} must be a positive integer <= ${max}, got ${value}`);
    }
  }
  function assertNonNegativeInt(value, name, max = 4096) {
    if (!Number.isInteger(value) || value < 0 || value > max) {
      throw new Error(`${name} must be a non-negative integer <= ${max}, got ${value}`);
    }
  }
  function normalizeRgbaFrame(frame, index) {
    if (!frame || typeof frame !== "object") {
      throw new Error(`buildRgbaAtlas: frame at index ${index} must be an object`);
    }
    assertPositiveInt(frame.width, `buildRgbaAtlas: frame ${index} width`);
    assertPositiveInt(frame.height, `buildRgbaAtlas: frame ${index} height`);
    if (!(frame.rgba instanceof Uint8ClampedArray) && !(frame.rgba instanceof Uint8Array)) {
      throw new Error(`buildRgbaAtlas: frame ${index} rgba must be a Uint8ClampedArray or Uint8Array`);
    }
    const expectedLength = frame.width * frame.height * 4;
    if (frame.rgba.length < expectedLength) {
      throw new Error(`buildRgbaAtlas: frame ${index} rgba is too small (${frame.rgba.length}, expected ${expectedLength})`);
    }
    return {
      name: frame.name || `frame_${index}`,
      width: frame.width,
      height: frame.height,
      rgba: frame.rgba,
      pivot: frame.pivot ? { ...frame.pivot } : void 0,
      animation: frame.animation ? { ...frame.animation } : void 0
    };
  }
  function validateAtlasPixelBudget(frames, shouldCancel) {
    let totalPixels = 0;
    frames.forEach((frame, index) => {
      throwIfAtlasCancelled(shouldCancel);
      if (!frame || typeof frame !== "object") {
        throw new Error(`buildRgbaAtlas: frame at index ${index} must be an object`);
      }
      assertPositiveInt(frame.width, `buildRgbaAtlas: frame ${index} width`);
      assertPositiveInt(frame.height, `buildRgbaAtlas: frame ${index} height`);
      totalPixels += frame.width * frame.height;
      if (totalPixels > MAX_RGBA_ATLAS_PIXELS) {
        throw new Error(`buildRgbaAtlas: source frames must contain at most ${MAX_RGBA_ATLAS_PIXELS} decoded pixels in total`);
      }
    });
  }
  function findTrimBounds(frame, shouldCancel) {
    let minX = frame.width;
    let minY = frame.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < frame.height; y++) {
      throwIfAtlasCancelled(shouldCancel);
      for (let x = 0; x < frame.width; x++) {
        const alpha = frame.rgba[(y * frame.width + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) {
      return { x: 0, y: 0, width: 1, height: 1 };
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }
  function copyFrameRegion(source, srcX, srcY, width, height, shouldCancel) {
    const out = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      throwIfAtlasCancelled(shouldCancel);
      for (let x = 0; x < width; x++) {
        const src = ((srcY + y) * source.width + (srcX + x)) * 4;
        const dst = (y * width + x) * 4;
        out[dst] = source.rgba[src];
        out[dst + 1] = source.rgba[src + 1];
        out[dst + 2] = source.rgba[src + 2];
        out[dst + 3] = source.rgba[src + 3];
      }
    }
    return out;
  }
  function planAtlasPlacements(frames, options) {
    const { padding, extrude, layout, columns, maxWidth, maxHeight } = options;
    const { shouldCancel } = options;
    const gutter = padding + extrude;
    const planned = frames.map((frame) => ({
      frame,
      slotWidth: frame.width + gutter * 2,
      slotHeight: frame.height + gutter * 2,
      pageIndex: 0,
      x: 0,
      y: 0
    }));
    planned.forEach((entry) => {
      throwIfAtlasCancelled(shouldCancel);
      if (maxWidth && entry.slotWidth > maxWidth) {
        throw new Error(`buildRgbaAtlas: frame "${entry.frame.name}" slot width ${entry.slotWidth} exceeds maxWidth ${maxWidth}`);
      }
      if (maxHeight && entry.slotHeight > maxHeight) {
        throw new Error(`buildRgbaAtlas: frame "${entry.frame.name}" slot height ${entry.slotHeight} exceeds maxHeight ${maxHeight}`);
      }
    });
    const createPage = (index) => ({ index, width: 1, height: 1, placements: [] });
    const pages = [createPage(0)];
    let pageIndex = 0;
    let currentPage = pages[0];
    const startPage = () => {
      pageIndex = pages.length;
      currentPage = createPage(pageIndex);
      pages.push(currentPage);
    };
    const placeEntry = (entry, x, y) => {
      entry.pageIndex = pageIndex;
      entry.x = x;
      entry.y = y;
      currentPage.placements.push(entry);
      currentPage.width = Math.max(currentPage.width, x + entry.slotWidth);
      currentPage.height = Math.max(currentPage.height, y + entry.slotHeight);
    };
    if (layout === "grid") {
      const cols = columns || Math.ceil(Math.sqrt(planned.length));
      let x = 0;
      let y = 0;
      let rowHeight = 0;
      let col = 0;
      planned.forEach((entry) => {
        throwIfAtlasCancelled(shouldCancel);
        if (col >= cols) {
          x = 0;
          y += rowHeight;
          rowHeight = 0;
          col = 0;
        }
        if (maxHeight && y > 0 && y + entry.slotHeight > maxHeight) {
          startPage();
          x = 0;
          y = 0;
          rowHeight = 0;
          col = 0;
        }
        placeEntry(entry, x, y);
        x += entry.slotWidth;
        rowHeight = Math.max(rowHeight, entry.slotHeight);
        col += 1;
      });
    } else if (maxWidth && maxHeight) {
      pages[0].freeRects = [{ x: 0, y: 0, width: maxWidth, height: maxHeight }];
      const placePackedEntry = (entry) => {
        let best = null;
        pages.forEach((page) => {
          throwIfAtlasCancelled(shouldCancel);
          (page.freeRects || []).forEach((rect) => {
            throwIfAtlasCancelled(shouldCancel);
            if (entry.slotWidth > rect.width || entry.slotHeight > rect.height) return;
            const remainingWidth = rect.width - entry.slotWidth;
            const remainingHeight = rect.height - entry.slotHeight;
            const candidate = {
              page,
              x: rect.x,
              y: rect.y,
              shortSideFit: Math.min(remainingWidth, remainingHeight),
              longSideFit: Math.max(remainingWidth, remainingHeight),
              areaFit: rect.width * rect.height - entry.slotWidth * entry.slotHeight
            };
            if (!best || candidate.shortSideFit < best.shortSideFit || candidate.shortSideFit === best.shortSideFit && candidate.areaFit < best.areaFit || candidate.shortSideFit === best.shortSideFit && candidate.areaFit === best.areaFit && candidate.longSideFit < best.longSideFit || candidate.shortSideFit === best.shortSideFit && candidate.areaFit === best.areaFit && candidate.longSideFit === best.longSideFit && candidate.page.index < best.page.index || candidate.shortSideFit === best.shortSideFit && candidate.areaFit === best.areaFit && candidate.longSideFit === best.longSideFit && candidate.page.index === best.page.index && candidate.y < best.y || candidate.shortSideFit === best.shortSideFit && candidate.areaFit === best.areaFit && candidate.longSideFit === best.longSideFit && candidate.page.index === best.page.index && candidate.y === best.y && candidate.x < best.x) {
              best = candidate;
            }
          });
        });
        if (!best) {
          startPage();
          currentPage.freeRects = [{ x: 0, y: 0, width: maxWidth, height: maxHeight }];
          best = {
            page: currentPage,
            x: 0,
            y: 0,
            shortSideFit: Math.min(maxWidth - entry.slotWidth, maxHeight - entry.slotHeight),
            longSideFit: Math.max(maxWidth - entry.slotWidth, maxHeight - entry.slotHeight),
            areaFit: maxWidth * maxHeight - entry.slotWidth * entry.slotHeight
          };
        }
        pageIndex = best.page.index;
        currentPage = best.page;
        placeEntry(entry, best.x, best.y);
        splitPackedFreeRects(best.page, {
          x: best.x,
          y: best.y,
          width: entry.slotWidth,
          height: entry.slotHeight
        });
      };
      planned.forEach(placePackedEntry);
      pages.forEach((page) => {
        throwIfAtlasCancelled(shouldCancel);
        delete page.freeRects;
      });
    } else {
      let x = 0;
      let y = 0;
      let rowHeight = 0;
      planned.forEach((entry) => {
        throwIfAtlasCancelled(shouldCancel);
        if (x > 0 && maxWidth && x + entry.slotWidth > maxWidth) {
          x = 0;
          y += rowHeight;
          rowHeight = 0;
        }
        if (maxHeight && y > 0 && y + entry.slotHeight > maxHeight) {
          startPage();
          x = 0;
          y = 0;
          rowHeight = 0;
        }
        placeEntry(entry, x, y);
        x += entry.slotWidth;
        rowHeight = Math.max(rowHeight, entry.slotHeight);
      });
    }
    return {
      placements: planned,
      width: pages[0].width,
      height: pages[0].height,
      pages
    };
  }
  function rectsIntersect(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  function rectContains(a, b) {
    return b.x >= a.x && b.y >= a.y && b.x + b.width <= a.x + a.width && b.y + b.height <= a.y + a.height;
  }
  function splitPackedFreeRects(page, used) {
    const next = [];
    (page.freeRects || []).forEach((rect) => {
      if (!rectsIntersect(rect, used)) {
        next.push(rect);
        return;
      }
      const rectRight = rect.x + rect.width;
      const rectBottom = rect.y + rect.height;
      const usedRight = used.x + used.width;
      const usedBottom = used.y + used.height;
      if (used.x > rect.x) {
        next.push({ x: rect.x, y: rect.y, width: used.x - rect.x, height: rect.height });
      }
      if (usedRight < rectRight) {
        next.push({ x: usedRight, y: rect.y, width: rectRight - usedRight, height: rect.height });
      }
      if (used.y > rect.y) {
        next.push({ x: rect.x, y: rect.y, width: rect.width, height: used.y - rect.y });
      }
      if (usedBottom < rectBottom) {
        next.push({ x: rect.x, y: usedBottom, width: rect.width, height: rectBottom - usedBottom });
      }
    });
    const filtered = next.filter((rect) => rect.width > 0 && rect.height > 0);
    const pruned = [];
    filtered.forEach((rect, index) => {
      const contained = filtered.some((candidate, candidateIndex) => candidateIndex !== index && rectContains(candidate, rect));
      if (!contained) pruned.push(rect);
    });
    pruned.sort((a, b) => a.y - b.y || a.x - b.x || a.width - b.width || a.height - b.height);
    page.freeRects = pruned;
  }
  function setRgbaPixel(rgba, atlasWidth, x, y, color) {
    const idx = (y * atlasWidth + x) * 4;
    rgba[idx] = color[0];
    rgba[idx + 1] = color[1];
    rgba[idx + 2] = color[2];
    rgba[idx + 3] = color[3];
  }
  function getFramePixel(frame, x, y) {
    const idx = (y * frame.width + x) * 4;
    return [
      frame.rgba[idx],
      frame.rgba[idx + 1],
      frame.rgba[idx + 2],
      frame.rgba[idx + 3]
    ];
  }
  function writeFrameWithExtrusion(atlasRgba, atlasWidth, placement, options) {
    const { frame, shouldCancel } = placement;
    const frameX = placement.x + options.padding + options.extrude;
    const frameY = placement.y + options.padding + options.extrude;
    for (let y = 0; y < frame.height; y++) {
      throwIfAtlasCancelled(shouldCancel);
      for (let x = 0; x < frame.width; x++) {
        setRgbaPixel(atlasRgba, atlasWidth, frameX + x, frameY + y, getFramePixel(frame, x, y));
      }
    }
    for (let e = 1; e <= options.extrude; e++) {
      throwIfAtlasCancelled(shouldCancel);
      for (let y = 0; y < frame.height; y++) {
        setRgbaPixel(atlasRgba, atlasWidth, frameX - e, frameY + y, getFramePixel(frame, 0, y));
        setRgbaPixel(atlasRgba, atlasWidth, frameX + frame.width - 1 + e, frameY + y, getFramePixel(frame, frame.width - 1, y));
      }
      for (let x = 0; x < frame.width; x++) {
        setRgbaPixel(atlasRgba, atlasWidth, frameX + x, frameY - e, getFramePixel(frame, x, 0));
        setRgbaPixel(atlasRgba, atlasWidth, frameX + x, frameY + frame.height - 1 + e, getFramePixel(frame, x, frame.height - 1));
      }
      setRgbaPixel(atlasRgba, atlasWidth, frameX - e, frameY - e, getFramePixel(frame, 0, 0));
      setRgbaPixel(atlasRgba, atlasWidth, frameX + frame.width - 1 + e, frameY - e, getFramePixel(frame, frame.width - 1, 0));
      setRgbaPixel(atlasRgba, atlasWidth, frameX - e, frameY + frame.height - 1 + e, getFramePixel(frame, 0, frame.height - 1));
      setRgbaPixel(atlasRgba, atlasWidth, frameX + frame.width - 1 + e, frameY + frame.height - 1 + e, getFramePixel(frame, frame.width - 1, frame.height - 1));
    }
  }
  function buildRgbaAtlas(frames, options = {}) {
    var _a, _b, _c, _d, _e;
    const shouldCancel = typeof options.shouldCancel === "function" ? options.shouldCancel : null;
    throwIfAtlasCancelled(shouldCancel);
    if (!Array.isArray(frames)) {
      throw new Error("buildRgbaAtlas: frames must be an array");
    }
    if (frames.length === 0) {
      throw new Error("buildRgbaAtlas: at least one frame is required");
    }
    validateAtlasPixelBudget(frames, shouldCancel);
    const padding = (_a = options.padding) != null ? _a : 0;
    const extrude = (_b = options.extrude) != null ? _b : 0;
    const layout = options.layout || "packed";
    const columns = (_c = options.columns) != null ? _c : 0;
    const maxWidth = (_d = options.maxWidth) != null ? _d : 0;
    const maxHeight = (_e = options.maxHeight) != null ? _e : 0;
    assertNonNegativeInt(padding, "buildRgbaAtlas: padding", 256);
    assertNonNegativeInt(extrude, "buildRgbaAtlas: extrude", 64);
    if (layout !== "packed" && layout !== "grid") {
      throw new Error(`buildRgbaAtlas: layout must be "packed" or "grid", got ${layout}`);
    }
    if (columns !== 0) assertPositiveInt(columns, "buildRgbaAtlas: columns");
    if (maxWidth !== 0) assertPositiveInt(maxWidth, "buildRgbaAtlas: maxWidth", 32768);
    if (maxHeight !== 0) assertPositiveInt(maxHeight, "buildRgbaAtlas: maxHeight", 32768);
    const frameNames = /* @__PURE__ */ new Set();
    const prepared = frames.map((frame, index) => {
      const normalized = normalizeRgbaFrame(frame, index);
      throwIfAtlasCancelled(shouldCancel);
      if (frameNames.has(normalized.name)) {
        throw new Error(`buildRgbaAtlas: frame name "${normalized.name}" is duplicated; frame names must be unique`);
      }
      frameNames.add(normalized.name);
      const trim = options.trim ? findTrimBounds(normalized, shouldCancel) : {
        x: 0,
        y: 0,
        width: normalized.width,
        height: normalized.height
      };
      return {
        ...normalized,
        sourceWidth: normalized.width,
        sourceHeight: normalized.height,
        sourceName: normalized.name,
        rgba: copyFrameRegion(normalized, trim.x, trim.y, trim.width, trim.height, shouldCancel),
        width: trim.width,
        height: trim.height,
        trim
      };
    });
    const { placements, pages } = planAtlasPlacements(prepared, {
      padding,
      extrude,
      layout,
      columns,
      maxWidth,
      maxHeight,
      shouldCancel
    });
    const atlasPixels = pages.reduce((sum, page) => sum + page.width * page.height, 0);
    if (!Number.isSafeInteger(atlasPixels) || atlasPixels > MAX_RGBA_ATLAS_PIXELS) {
      throw new Error(`buildRgbaAtlas: output pages must contain at most ${MAX_RGBA_ATLAS_PIXELS} decoded pixels in total`);
    }
    const atlasPages = pages.map((page) => {
      throwIfAtlasCancelled(shouldCancel);
      return {
        index: page.index,
        width: page.width,
        height: page.height,
        rgba: new Uint8ClampedArray(page.width * page.height * 4)
      };
    });
    const atlasFrames = placements.map((placement) => {
      throwIfAtlasCancelled(shouldCancel);
      const page = atlasPages[placement.pageIndex];
      writeFrameWithExtrusion(page.rgba, page.width, { ...placement, shouldCancel }, { padding, extrude });
      const frameX = placement.x + padding + extrude;
      const frameY = placement.y + padding + extrude;
      return {
        name: placement.frame.name,
        page: placement.pageIndex,
        pageIndex: placement.pageIndex,
        x: frameX,
        y: frameY,
        width: placement.frame.width,
        height: placement.frame.height,
        sourceWidth: placement.frame.sourceWidth,
        sourceHeight: placement.frame.sourceHeight,
        trim: { ...placement.frame.trim },
        pivot: placement.frame.pivot ? { ...placement.frame.pivot } : void 0,
        animation: placement.frame.animation ? { ...placement.frame.animation } : void 0,
        u: frameX / page.width,
        v: frameY / page.height,
        uw: placement.frame.width / page.width,
        uh: placement.frame.height / page.height
      };
    });
    const firstPage = atlasPages[0];
    return {
      width: firstPage.width,
      height: firstPage.height,
      rgba: firstPage.rgba,
      pages: atlasPages,
      frames: atlasFrames,
      meta: {
        layout,
        padding,
        extrude,
        trim: !!options.trim,
        maxWidth: maxWidth || void 0,
        maxHeight: maxHeight || void 0,
        pageCount: atlasPages.length
      }
    };
  }
  var GROUT13_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
  function assertPositiveInteger(value, label, max = 32768) {
    if (!Number.isInteger(value) || value <= 0 || value > max) {
      throw new Error(`${label} must be a positive integer <= ${max}`);
    }
  }
  function encodeGrout13Runs(indexedPixels, options = {}) {
    if (!indexedPixels || typeof indexedPixels.length !== "number") {
      throw new Error("Grout13 indexed pixels must be an array-like value");
    }
    const rowBoundOpaque = options.rowBoundOpaque === true;
    const width = options.width;
    if (rowBoundOpaque) {
      assertPositiveInteger(width, "Grout13 row-bound width");
    }
    let encoded = "";
    for (let i = 0; i < indexedPixels.length; ) {
      const color = indexedPixels[i];
      if (!Number.isInteger(color) || color < 0 || color >= GROUT13_ALPHABET.length) {
        throw new Error(`Grout13 color index out of range: ${color}`);
      }
      let run = 1;
      while (i + run < indexedPixels.length && indexedPixels[i + run] === color && run < GROUT13_ALPHABET.length) {
        if (rowBoundOpaque && color !== 0 && (i + run) % width === 0) {
          break;
        }
        run += 1;
      }
      encoded += GROUT13_ALPHABET[run - 1] + GROUT13_ALPHABET[color];
      i += run;
    }
    return encoded;
  }
  function decodeGrout13Runs(encoded, pixelCount) {
    if (typeof encoded !== "string") {
      throw new Error("Grout13 encoded runs must be a string");
    }
    assertPositiveInteger(pixelCount, "Grout13 pixel count", 32768 * 32768);
    if (encoded.length % 2 !== 0) {
      throw new Error("Grout13 encoded run stream must contain count/color pairs");
    }
    const out = new Uint8Array(pixelCount);
    let offset = 0;
    for (let i = 0; i < encoded.length; i += 2) {
      const run = GROUT13_ALPHABET.indexOf(encoded[i]) + 1;
      const color = GROUT13_ALPHABET.indexOf(encoded[i + 1]);
      if (run <= 0 || color < 0) {
        throw new Error("Grout13 encoded run stream contains an unsupported character");
      }
      if (offset + run > out.length) {
        throw new Error("Grout13 encoded run stream exceeds the expected pixel count");
      }
      out.fill(color, offset, offset + run);
      offset += run;
    }
    if (offset !== out.length) {
      throw new Error("Grout13 encoded run stream ended before the expected pixel count");
    }
    return out;
  }
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
  var IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;
  var RUN_PAIR_ERROR = "Grout13 run stream must contain count/color pairs";
  var RUN_VALUE_ERROR = "Grout13 run stream contains an unsupported character";
  function assertRuntimeIdentifier(value, label) {
    assertGrout13Name(value, label);
    if (!IDENTIFIER_RE.test(value)) {
      throw new Error(`${label} must be a valid JavaScript identifier`);
    }
  }
  function assertGrout13RuntimeMode(value, label, allowed) {
    if (allowed.indexOf(value) === -1) {
      throw new Error(`Grout13 ${label} must be ${allowed.map((item) => `"${item}"`).join(" or ")}`);
    }
  }
  function createCanvasArgument(runtimeTarget, requireCanvas) {
    if (runtimeTarget !== "canvas") return "";
    return requireCanvas === true ? "C" : 'C=document.createElement("canvas")';
  }
  function createRuntimeFrameStore(targetExpr = "r", includeMetadata = false) {
    if (!includeMetadata) {
      return `for(i=0;i<f.length;i+=4,j++){s=n[j]||j;if(Object.prototype.hasOwnProperty.call(${targetExpr},s)){throw new Error("Grout13 frame names must be unique");}if(!Number.isInteger(f[i])||f[i]<0||!Number.isInteger(f[i+1])||f[i+1]<0||!Number.isInteger(f[i+2])||f[i+2]<=0||!Number.isInteger(f[i+3])||f[i+3]<=0){throw new Error("Grout13 decoded frame metadata must use integer geometry");}${targetExpr}[s]={x:f[i],y:f[i+1],w:f[i+2],h:f[i+3]}}`;
    }
    return `for(i=0;i<f.length;i+=4,j++){k=j*8;s=n[j]||j;if(Object.prototype.hasOwnProperty.call(${targetExpr},s)){throw new Error("Grout13 frame names must be unique");}x=f[i];y=f[i+1];w=f[i+2];h=f[i+3];if(!Number.isInteger(x)||x<0||!Number.isInteger(y)||y<0||!Number.isInteger(w)||w<=0||!Number.isInteger(h)||h<=0){throw new Error("Grout13 decoded frame metadata must use integer geometry");}a0=m[k];a1=m[k+1];a2=m[k+2];a3=m[k+3];a4=m[k+4];a5=m[k+5];a6=m[k+6];a7=m[k+7];sw=a0==null?w:a0;sh=a1==null?h:a1;tx=a2==null?0:a2;ty=a3==null?0:a3;tw=a4==null?w:a4;th=a5==null?h:a5;if(!Number.isInteger(sw)||sw<=0||!Number.isInteger(sh)||sh<=0||!Number.isInteger(tx)||tx<0||!Number.isInteger(ty)||ty<0||!Number.isInteger(tw)||tw<=0||!Number.isInteger(th)||th<=0){throw new Error("Grout13 decoded frame metadata must use integer values");}${targetExpr}[s]={x:x,y:y,w:w,h:h,sourceSize:{w:sw,h:sh},spriteSourceSize:{x:tx,y:ty,w:tw,h:th}};if(a6!=null||a7!=null){if(a6==null||a7==null||typeof a6!=="number"||typeof a7!=="number"||!Number.isFinite(a6)||!Number.isFinite(a7)){throw new Error("Grout13 decoded frame metadata must use finite pivot values");}${targetExpr}[s].pivot={x:a6,y:a7}}}`;
  }
  function createDrawLoop(mode) {
    return mode === "row" ? 'if((o%W)+q>W)throw new Error("Grout13 row run exceeds width");x.fillStyle="#"+p.slice((z-1)*6,z*6),x.fillRect(o%W,o/W|0,q,1),o+=q' : 'x.fillStyle="#"+p.slice((z-1)*6,z*6);for(;q--;)x.fillRect(o%W,o/W|0,1,1),o++';
  }
  function createRunDecodeHeader() {
    return `if((d.length&1)!==0){throw new Error("${RUN_PAIR_ERROR}");}`;
  }
  function createRunDecodeLoop(decodeBody) {
    return `${createRunDecodeHeader()}for(;i<d.length;i+=2){q=a.indexOf(d[i]);if(q===-1){throw new Error("${RUN_VALUE_ERROR}");}z=a.indexOf(d[i+1]);if(z===-1){throw new Error("${RUN_VALUE_ERROR}");}q++;if(z){${decodeBody}}else{o+=q}}`;
  }
  function createNonCanvasSource(runtimeTarget, drawMode, functionName, frameMode, terse) {
    const B = runtimeTarget === "indexed" ? "B=new Uint8Array(W*g[1]);" : "B=new Uint8ClampedArray(W*g[1]*4);";
    const decodeBody = runtimeTarget === "indexed" ? "B.fill(z,o,o+q);o+=q" : "v=parseInt(p.slice((z-1)*6,z*6),16);for(;q--;){t=o++*4;B[t]=v>>16&255;B[t+1]=v>>8&255;B[t+2]=v&255;B[t+3]=255}";
    const decodeSource = `${B}${createRunDecodeLoop(decodeBody)};`;
    const rawReturn = runtimeTarget === "indexed" ? terse ? "[B,g[4]]" : "{width:W,height:g[1],indexed:B,palette:p,frames:g[4]}" : terse ? "[B,g[4]]" : "{width:W,height:g[1],rgba:B,frames:g[4]}";
    const returnExpression = runtimeTarget === "indexed" ? terse ? "{w:W,h:g[1],i:B,p:p,f:r}" : "{width:W,height:g[1],indexed:B,palette:p,frames:r}" : terse ? "{w:W,h:g[1],r:B,p:p,f:r}" : "{width:W,height:g[1],rgba:B,frames:r}";
    if (frameMode === "raw") {
      return `function ${functionName}(g){let W=g[0],a="${GROUT13_ALPHABET}",p=g[2],d=g[3],i=0,o=0,q,z,B,v,t;${decodeSource}return${rawReturn}}`;
    }
    if (frameMode === "metadata") {
      return `function ${functionName}(g){let W=g[0],a="${GROUT13_ALPHABET}",p=g[2],d=g[3],f=g[4],n=(g[5]||"").split("|"),m=g[6]||[],r={},i=0,o=0,q=0,z=0,j=0,k=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,x=0,y=0,w=0,h=0,sw=0,sh=0,tx=0,ty=0,tw=0,th=0,s=null;${decodeSource}${createRuntimeFrameStore("r", true)}return${returnExpression}}`;
    }
    return `function ${functionName}(g){let W=g[0],a="${GROUT13_ALPHABET}",p=g[2],d=g[3],f=g[4],n=(g[5]||"").split("|"),r={},i=0,o=0,q=0,z=0,j=0,s=0;${decodeSource}${createRuntimeFrameStore("r", false)};return${returnExpression}}`;
  }
  function createCanvasSource(runtimeTarget, drawMode, functionName, frameMode, terse, requireCanvas) {
    const drawOpaque = createDrawLoop(drawMode);
    const rawReturn = terse ? "[C,g[4]]" : "{canvas:C,frames:g[4]}";
    const returnExpression = terse ? "{c:C,f:r}" : "{canvas:C,frames:r}";
    const canvasArgument = createCanvasArgument(runtimeTarget, requireCanvas);
    const decodeDraw = createRunDecodeLoop(drawOpaque);
    if (frameMode === "raw") {
      return `function ${functionName}(g,${canvasArgument}){let W=g[0],x,a="${GROUT13_ALPHABET}",p=g[2],d=g[3],i=0,o=0,q=0,z=0;C.width=W;C.height=g[1];x=C.getContext("2d");${decodeDraw};return${rawReturn}}`;
    }
    if (frameMode === "metadata") {
      return `function ${functionName}(g,${canvasArgument}){let W=g[0],x,a="${GROUT13_ALPHABET}",p=g[2],d=g[3],f=g[4],n=(g[5]||"").split("|"),m=g[6]||[],r={},i=0,o=0,q=0,z=0,j=0,k=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,y=0,w=0,h=0,sw=0,sh=0,tx=0,ty=0,tw=0,th=0,s=0;C.width=W;C.height=g[1];x=C.getContext("2d");${decodeDraw}${createRuntimeFrameStore("r", true)};return${returnExpression}}`;
    }
    return `function ${functionName}(g,${canvasArgument}){let W=g[0],x,a="${GROUT13_ALPHABET}",p=g[2],d=g[3],f=g[4],n=(g[5]||"").split("|"),r={},i=0,o=0,q=0,z=0,j=0,s=0;C.width=W;C.height=g[1];x=C.getContext("2d");${decodeDraw}${createRuntimeFrameStore("r", false)};return${returnExpression}}`;
  }
  function createGrout13RuntimeSource(options = {}) {
    const functionName = options.functionName || "grout13";
    const terse = options.terse === true;
    const frameMode = options.frameMode || "object";
    const drawMode = options.drawMode || "pixel";
    const runtimeTarget = options.runtimeTarget || "canvas";
    assertRuntimeIdentifier(functionName, "Grout13 runtime functionName");
    assertGrout13RuntimeMode(frameMode, "runtime frameMode", ["object", "raw", "metadata"]);
    assertGrout13RuntimeMode(drawMode, "runtime drawMode", ["pixel", "row"]);
    assertGrout13RuntimeMode(runtimeTarget, "runtimeTarget", ["canvas", "rgba", "indexed"]);
    if (runtimeTarget !== "canvas" && options.requireCanvas === true) {
      throw new Error("Grout13 byte-buffer runtime targets cannot require a canvas");
    }
    const makeSource = runtimeTarget === "canvas" ? () => createCanvasSource(runtimeTarget, drawMode, functionName, frameMode, terse, options.requireCanvas === true) : () => createNonCanvasSource(runtimeTarget, drawMode, functionName, frameMode, terse);
    return makeSource();
  }
  function createGrout13BundleSource(payload, options = {}) {
    const payloadName = options.payloadName || "G13";
    const functionName = options.functionName || "grout13";
    assertRuntimeIdentifier(payloadName, "Grout13 payloadName");
    assertRuntimeIdentifier(functionName, "Grout13 runtime functionName");
    const source = `const ${payloadName}=${JSON.stringify(payload)};${createGrout13RuntimeSource({
      functionName,
      terse: options.terse === true,
      frameMode: options.frameMode || "object",
      drawMode: options.drawMode || "pixel",
      runtimeTarget: options.runtimeTarget || "canvas",
      requireCanvas: options.requireCanvas === true
    })}`;
    return options.module === true ? `${source}ex${"port"}{${payloadName},${functionName}};` : source;
  }
  var GROUT13_FORMAT_VERSION = 1;
  var DEFAULT_GROUT13_ATLAS_OPTIONS = Object.freeze({
    layout: "packed",
    padding: 0,
    extrude: 0,
    trim: true,
    maxWidth: 512,
    maxHeight: 512
  });
  var MAX_GROUT13_COLORS = GROUT13_ALPHABET.length - 1;
  var MAX_GROUT13_DECODED_PIXELS = 16777216;
  var MAX_GROUT13_ASSETS = 256;
  var MAX_GROUT13_TOTAL_STEPS = 5e4;
  function assertPositiveInteger2(value, label, max = 32768) {
    if (!Number.isInteger(value) || value <= 0 || value > max) {
      throw new Error(`${label} must be a positive integer <= ${max}`);
    }
  }
  function assertNonNegativeInteger(value, label, max = 32768) {
    if (!Number.isInteger(value) || value < 0 || value > max) {
      throw new Error(`${label} must be a non-negative integer <= ${max}`);
    }
  }
  function utf8Bytes(text) {
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(text).length;
    }
    return unescape(encodeURIComponent(text)).length;
  }
  function rgb24ToHex(rgb24) {
    return (rgb24 & 16777215).toString(16).padStart(6, "0");
  }
  function normalizePalette(palette) {
    if (!Array.isArray(palette)) return null;
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const color of palette) {
      if (!Number.isInteger(color) || color < 0 || color > 16777215) {
        throw new Error("Grout13 palette entries must be integer RGB24 values from 0x000000 through 0xffffff");
      }
      if (seen.has(color)) continue;
      seen.add(color);
      out.push(color);
    }
    if (out.length > MAX_GROUT13_COLORS) {
      throw new Error(`Grout13 supports at most ${MAX_GROUT13_COLORS} opaque palette colors`);
    }
    return out;
  }
  function normalizeAsset(asset, index) {
    var _a, _b;
    if (!asset || typeof asset !== "object") {
      throw new Error(`Grout13 asset ${index} must be an object`);
    }
    const spec = asset.spec || asset;
    const sequenceIndex = (_a = asset.sequenceIndex) != null ? _a : 0;
    if (!Number.isInteger(sequenceIndex) || sequenceIndex < 0) {
      throw new Error(`Grout13 asset ${index} sequenceIndex must be a non-negative integer`);
    }
    if (spec && typeof spec === "object" && Array.isArray(spec.sequence) && sequenceIndex >= spec.sequence.length) {
      throw new Error(`Grout13 asset ${index} sequenceIndex ${sequenceIndex} is out of range`);
    }
    const name = asset.name || spec.name || `frame_${index}`;
    assertGrout13Name(name, `Grout13 asset ${index}`);
    return {
      name,
      spec,
      pivot: asset.pivot || spec.pivot,
      animation: asset.animation || spec.animation,
      sequenceIndex: (_b = asset.sequenceIndex) != null ? _b : 0
    };
  }
  function preflightGrout13Assets(assets) {
    if (assets.length > MAX_GROUT13_ASSETS) {
      throw new Error(`Grout13 compile input must contain at most ${MAX_GROUT13_ASSETS} assets`);
    }
    let totalPixels = 0;
    let totalSteps = 0;
    for (let index = 0; index < assets.length; index += 1) {
      const normalized = normalizeAsset(assets[index], index);
      let spec;
      try {
        const source = normalized.spec;
        const clone = typeof structuredClone === "function" ? structuredClone(source) : JSON.parse(JSON.stringify(source));
        spec = normalizeSpec(clone);
      } catch (error) {
        const reason = error && error.message ? error.message : String(error);
        throw new Error(`Grout13 asset ${index} failed resource preflight: ${reason}`);
      }
      if (normalized.sequenceIndex >= spec.sequence.length) {
        throw new Error(`Grout13 asset ${index} sequenceIndex ${normalized.sequenceIndex} is out of range`);
      }
      const pixels = spec.w * spec.h;
      totalPixels += pixels;
      if (!Number.isSafeInteger(totalPixels) || totalPixels > MAX_GROUT13_DECODED_PIXELS) {
        throw new Error(`Grout13 compile input exceeds the ${MAX_GROUT13_DECODED_PIXELS}-pixel source budget`);
      }
      for (const frame of spec.frames) {
        totalSteps += frame.steps.length;
        if (totalSteps > MAX_GROUT13_TOTAL_STEPS) {
          throw new Error(`Grout13 compile input must contain at most ${MAX_GROUT13_TOTAL_STEPS} drawing steps in total`);
        }
      }
    }
  }
  function assertDistinctFrameName(name, map, context) {
    assertGrout13Name(name, `Grout13 ${context}`);
    if (Object.prototype.hasOwnProperty.call(map, name)) {
      throw new Error(`Grout13 ${context} name "${name}" is duplicated`);
    }
    map[name] = true;
    return name;
  }
  function normalizeOptionalPoint(point, label) {
    if (point === void 0 || point === null) return void 0;
    if (typeof point !== "object" || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error(`${label} must be an object with finite x and y values`);
    }
    return { x: point.x, y: point.y };
  }
  function decodeRenderedPaletteColor(palette, colorIndex, frameName) {
    if (!Number.isInteger(colorIndex) || colorIndex < 0) {
      throw new Error(`Grout13 asset ${frameName} uses an invalid color index`);
    }
    const value = palette[colorIndex];
    if (colorIndex < 256) {
      if (!Number.isInteger(value) || value < 0 || value > 16777215) {
        throw new Error(`Grout13 asset ${frameName} uses color ${colorIndex}, which is not present in its palette`);
      }
      return {
        r: value >> 16 & 255,
        g: value >> 8 & 255,
        b: value & 255,
        alpha: 255
      };
    }
    if (!Number.isInteger(value)) {
      throw new Error(`Grout13 asset ${frameName} contains an invalid palette value`);
    }
    const entry = value >>> 0;
    const alpha = entry & 255;
    if (alpha === 0) {
      return { r: 0, g: 0, b: 0, alpha: 0 };
    }
    if (alpha !== 255) {
      throw new Error(`Grout13 asset ${frameName} contains a semi-transparent color token`);
    }
    return {
      r: entry >>> 24 & 255,
      g: entry >>> 16 & 255,
      b: entry >>> 8 & 255,
      alpha: 255
    };
  }
  function renderAssetToRgbaFrame(asset, index, options = {}) {
    const { name, spec, pivot, animation, sequenceIndex } = normalizeAsset(asset, index);
    const renderStrict = options.strict === false ? false : true;
    const rendered = renderIndexBuffer(spec, sequenceIndex, { strict: renderStrict });
    const buffer = rendered.buffer || rendered;
    const width = rendered.w || spec.w;
    const height = rendered.h || spec.h;
    assertPositiveInteger2(width, `Grout13 asset ${name} width`);
    assertPositiveInteger2(height, `Grout13 asset ${name} height`);
    if (buffer.length !== width * height) {
      throw new Error(`Grout13 asset ${name} rendered buffer length does not match dimensions`);
    }
    const palette = rendered.palette || (spec.customPalette ? [...spec.customPalette, ...DEFAULT_PALETTE_RGB24] : DEFAULT_PALETTE_RGB24);
    if (!Array.isArray(palette)) {
      throw new Error(`Grout13 asset ${name} rendered without a palette`);
    }
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < buffer.length; i += 1) {
      const value = buffer[i];
      const offset = i * 4;
      if (value < 0) {
        rgba[offset + 3] = 0;
        continue;
      }
      const entry = decodeRenderedPaletteColor(palette, value, name);
      if (entry.alpha === 0) {
        rgba[offset + 3] = 0;
        continue;
      }
      rgba[offset] = entry.r;
      rgba[offset + 1] = entry.g;
      rgba[offset + 2] = entry.b;
      rgba[offset + 3] = entry.alpha;
    }
    const frame = { name, width, height, rgba };
    const normalizedPivot = normalizeOptionalPoint(pivot, `Grout13 asset ${name} pivot`);
    if (normalizedPivot) frame.pivot = normalizedPivot;
    if (animation && typeof animation === "object") frame.animation = { ...animation };
    return frame;
  }
  function ensureSinglePageAtlas(atlas, atlasOptions) {
    const pages = Array.isArray(atlas.pages) ? atlas.pages : [{ index: 0, width: atlas.width, height: atlas.height, rgba: atlas.rgba }];
    if (pages.length !== 1) {
      throw new Error("Grout13 compile target expects a single atlas page; raise maxWidth/maxHeight or split payloads");
    }
    if (atlasOptions.maxWidth && atlas.width > atlasOptions.maxWidth) {
      throw new Error(`Grout13 atlas width ${atlas.width} exceeds maxWidth ${atlasOptions.maxWidth}`);
    }
    if (atlasOptions.maxHeight && atlas.height > atlasOptions.maxHeight) {
      throw new Error(`Grout13 atlas height ${atlas.height} exceeds maxHeight ${atlasOptions.maxHeight}`);
    }
  }
  function buildSinglePageAtlas(frames, atlasOptions) {
    const atlas = buildRgbaAtlas(frames, atlasOptions);
    ensureSinglePageAtlas(atlas, atlasOptions);
    return atlas;
  }
  function collectPaletteFromRgba(rgba) {
    const colors = [];
    const seen = /* @__PURE__ */ new Set();
    for (let i = 0; i < rgba.length; i += 4) {
      const alpha = rgba[i + 3];
      if (alpha === 0) continue;
      if (alpha !== 255) {
        throw new Error("Grout13 supports binary alpha only; bake semi-transparent art before compiling");
      }
      const rgb = rgba[i] << 16 | rgba[i + 1] << 8 | rgba[i + 2];
      if (seen.has(rgb)) continue;
      seen.add(rgb);
      colors.push(rgb);
      if (colors.length > MAX_GROUT13_COLORS) {
        throw new Error(`Grout13 supports at most ${MAX_GROUT13_COLORS} opaque palette colors`);
      }
    }
    return colors;
  }
  function createPaletteIndex(palette) {
    const index = /* @__PURE__ */ new Map();
    palette.forEach((rgb, colorIndex) => {
      index.set(rgb, colorIndex + 1);
    });
    return index;
  }
  function indexRgba(rgba, palette) {
    const colorIndex = createPaletteIndex(palette);
    const indexed = new Uint8Array(rgba.length / 4);
    for (let i = 0, pixel = 0; i < rgba.length; i += 4, pixel += 1) {
      const alpha = rgba[i + 3];
      if (alpha === 0) continue;
      if (alpha !== 255) {
        throw new Error("Grout13 supports binary alpha only; bake semi-transparent art before compiling");
      }
      const rgb = rgba[i] << 16 | rgba[i + 1] << 8 | rgba[i + 2];
      const mapped = colorIndex.get(rgb);
      if (!mapped) {
        throw new Error(`Grout13 palette is missing #${rgb24ToHex(rgb)}`);
      }
      indexed[pixel] = mapped;
    }
    return indexed;
  }
  function paletteToHexString(palette) {
    return palette.map(rgb24ToHex).join("");
  }
  function paletteHexToArray(paletteHex) {
    if (typeof paletteHex !== "string" || paletteHex.length % 6 !== 0) {
      throw new Error("Grout13 palette string must use 6 hex characters per color");
    }
    if (paletteHex.length > 0 && !/^[0-9a-fA-F]+$/.test(paletteHex)) {
      throw new Error("Grout13 palette string contains invalid hex");
    }
    const colors = [];
    for (let i = 0; i < paletteHex.length; i += 6) {
      colors.push(Number.parseInt(paletteHex.slice(i, i + 6), 16));
    }
    if (colors.length > MAX_GROUT13_COLORS) {
      throw new Error(`Grout13 supports at most ${MAX_GROUT13_COLORS} opaque palette colors`);
    }
    return colors;
  }
  function indexedToRgba(indexed, palette) {
    const rgba = new Uint8ClampedArray(indexed.length * 4);
    for (let i = 0; i < indexed.length; i += 1) {
      const colorIndex = indexed[i];
      if (colorIndex === 0) continue;
      const rgb = palette[colorIndex - 1];
      if (!Number.isInteger(rgb)) {
        throw new Error(`Grout13 decoded color index out of palette range: ${colorIndex}`);
      }
      const offset = i * 4;
      rgba[offset] = rgb >> 16 & 255;
      rgba[offset + 1] = rgb >> 8 & 255;
      rgba[offset + 2] = rgb & 255;
      rgba[offset + 3] = 255;
    }
    return rgba;
  }
  function readMetadataValue(metadataData, index, fallbackValue) {
    if (!Array.isArray(metadataData)) {
      return fallbackValue;
    }
    const value = metadataData[index];
    return value === null || value === void 0 ? fallbackValue : value;
  }
  function createFrameMetadata(frameData, metadataData, frameIndex, offset) {
    const metaOffset = frameIndex * 8;
    const x = frameData[offset];
    const y = frameData[offset + 1];
    const w = frameData[offset + 2];
    const h = frameData[offset + 3];
    assertNonNegativeInteger(x, `Grout13 decoded frame ${frameIndex} x`);
    assertNonNegativeInteger(y, `Grout13 decoded frame ${frameIndex} y`);
    assertPositiveInteger2(w, `Grout13 decoded frame ${frameIndex} w`);
    assertPositiveInteger2(h, `Grout13 decoded frame ${frameIndex} h`);
    const sourceWidth = readMetadataValue(metadataData, metaOffset, w);
    const sourceHeight = readMetadataValue(metadataData, metaOffset + 1, h);
    const trimX = readMetadataValue(metadataData, metaOffset + 2, 0);
    const trimY = readMetadataValue(metadataData, metaOffset + 3, 0);
    const trimWidth = readMetadataValue(metadataData, metaOffset + 4, w);
    const trimHeight = readMetadataValue(metadataData, metaOffset + 5, h);
    const metadataPivotX = readMetadataValue(metadataData, metaOffset + 6, null);
    const metadataPivotY = readMetadataValue(metadataData, metaOffset + 7, null);
    if (Array.isArray(metadataData)) {
      if (!Number.isInteger(sourceWidth)) {
        throw new Error(`Grout13 decoded frame ${frameIndex} sourceSize.w must be an integer`);
      }
      if (!Number.isInteger(sourceHeight)) {
        throw new Error(`Grout13 decoded frame ${frameIndex} sourceSize.h must be an integer`);
      }
      if (!Number.isInteger(trimX)) {
        throw new Error(`Grout13 decoded frame ${frameIndex} spriteSourceSize.x must be an integer`);
      }
      if (!Number.isInteger(trimY)) {
        throw new Error(`Grout13 decoded frame ${frameIndex} spriteSourceSize.y must be an integer`);
      }
      if (!Number.isInteger(trimWidth)) {
        throw new Error(`Grout13 decoded frame ${frameIndex} spriteSourceSize.w must be an integer`);
      }
      if (!Number.isInteger(trimHeight)) {
        throw new Error(`Grout13 decoded frame ${frameIndex} spriteSourceSize.h must be an integer`);
      }
      if (metadataPivotX !== null) {
        if (typeof metadataPivotX !== "number" || typeof metadataPivotY !== "number") {
          throw new Error(`Grout13 decoded frame ${frameIndex} pivot must use finite numbers`);
        }
        if (!Number.isFinite(metadataPivotX) || !Number.isFinite(metadataPivotY)) {
          throw new Error(`Grout13 decoded frame ${frameIndex} pivot must use finite numbers`);
        }
      }
    }
    assertPositiveInteger2(sourceWidth, `Grout13 decoded frame ${frameIndex} sourceSize.w`);
    assertPositiveInteger2(sourceHeight, `Grout13 decoded frame ${frameIndex} sourceSize.h`);
    assertNonNegativeInteger(trimX, `Grout13 decoded frame ${frameIndex} spriteSourceSize.x`);
    assertNonNegativeInteger(trimY, `Grout13 decoded frame ${frameIndex} spriteSourceSize.y`);
    assertPositiveInteger2(trimWidth, `Grout13 decoded frame ${frameIndex} spriteSourceSize.w`);
    assertPositiveInteger2(trimHeight, `Grout13 decoded frame ${frameIndex} spriteSourceSize.h`);
    const frame = {
      x,
      y,
      w,
      h,
      sourceSize: { w: sourceWidth, h: sourceHeight },
      spriteSourceSize: { x: trimX, y: trimY, w: trimWidth, h: trimHeight }
    };
    if (Array.isArray(metadataData) && metadataPivotX !== null && metadataPivotY !== null) {
      frame.pivot = { x: metadataPivotX, y: metadataPivotY };
    }
    return frame;
  }
  function createFramesObject(frameData, namesText, metadataData = null) {
    if (!Array.isArray(frameData) || frameData.length % 4 !== 0) {
      throw new Error("Grout13 frame data must be a flat [x,y,w,h] array");
    }
    if (metadataData !== null && (!Array.isArray(metadataData) || metadataData.length !== frameData.length / 4 * 8)) {
      throw new Error("Grout13 metadata data must contain 8 values per frame");
    }
    const names = typeof namesText === "string" && namesText.length > 0 ? namesText.split("|") : [];
    if (names.length > frameData.length / 4) {
      throw new Error("Grout13 frame names contain more entries than frame data");
    }
    const nameSet = /* @__PURE__ */ Object.create(null);
    const frames = {};
    for (let i = 0, frameIndex = 0; i < frameData.length; i += 4, frameIndex += 1) {
      const rawName = names[frameIndex] || String(frameIndex);
      const name = assertDistinctFrameName(rawName, nameSet, `decoded frame ${frameIndex}`);
      if (metadataData) {
        frames[name] = createFrameMetadata(frameData, metadataData, frameIndex, i);
        continue;
      }
      const x = frameData[i];
      const y = frameData[i + 1];
      const w = frameData[i + 2];
      const h = frameData[i + 3];
      assertNonNegativeInteger(x, `Grout13 decoded frame ${frameIndex} x`);
      assertNonNegativeInteger(y, `Grout13 decoded frame ${frameIndex} y`);
      assertPositiveInteger2(w, `Grout13 decoded frame ${frameIndex} w`);
      assertPositiveInteger2(h, `Grout13 decoded frame ${frameIndex} h`);
      frames[name] = { x, y, w, h };
    }
    return frames;
  }
  function createCanvasFromRgba(width, height, rgba, canvasFactory) {
    const factory = canvasFactory || (() => {
      if (typeof document === "undefined" || typeof document.createElement !== "function") {
        return null;
      }
      return document.createElement("canvas");
    });
    const canvas = factory(width, height);
    if (!canvas) return null;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext && canvas.getContext("2d", { alpha: true });
    if (!ctx || typeof ctx.createImageData !== "function" || typeof ctx.putImageData !== "function") {
      throw new Error("Grout13 canvasFactory must return a 2D canvas with ImageData support");
    }
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  function decodeGrout13Atlas(payload, options = {}) {
    if (!Array.isArray(payload) || payload.length < 5) {
      throw new Error("Grout13 payload must be [width,height,palette,runs,frames,names?]");
    }
    const [width, height, paletteHex, encoded, frameData, namesText = "", metadataData = null] = payload;
    assertPositiveInteger2(width, "Grout13 payload width");
    assertPositiveInteger2(height, "Grout13 payload height");
    const pixelCount = width * height;
    if (!Number.isSafeInteger(pixelCount) || pixelCount > MAX_GROUT13_DECODED_PIXELS) {
      throw new Error(`Grout13 payload exceeds the ${MAX_GROUT13_DECODED_PIXELS}-pixel limit`);
    }
    const palette = paletteHexToArray(paletteHex);
    const indexed = decodeGrout13Runs(encoded, pixelCount);
    const rgba = indexedToRgba(indexed, palette);
    const frames = createFramesObject(frameData, namesText, metadataData);
    const canvas = createCanvasFromRgba(width, height, rgba, options.canvasFactory);
    return { width, height, palette, indexed, rgba, canvas, frames };
  }
  function createFrameIndexMetadata(frames) {
    const frameOrder = [];
    const frameIndexMap = /* @__PURE__ */ Object.create(null);
    const seenNames = /* @__PURE__ */ Object.create(null);
    for (let index = 0; index < frames.length; index += 1) {
      const name = frames[index].name;
      const canonicalName = assertDistinctFrameName(name, seenNames, `frame ${index}`);
      frameOrder.push(name);
      frameIndexMap[canonicalName] = index;
    }
    return { frameOrder, frameIndexMap };
  }
  function getCompiledRuntimeOptions(compiled, options = {}) {
    if (!compiled || typeof compiled !== "object" || !Array.isArray(compiled.payload)) {
      throw new Error("Grout13 compiled atlas is required");
    }
    const contract = compiled.runtimeContract;
    if (!contract || typeof contract !== "object") {
      throw new Error("Grout13 compiled atlas is missing runtimeContract");
    }
    if (contract.formatVersion !== GROUT13_FORMAT_VERSION) {
      throw new Error(`Grout13 compiled runtime format version is "${contract.formatVersion}", not ${GROUT13_FORMAT_VERSION}`);
    }
    if (options.frameMode && options.frameMode !== contract.frameMode) {
      throw new Error(`Grout13 compiled runtime frameMode is "${contract.frameMode}", not "${options.frameMode}"`);
    }
    if (options.drawMode && options.drawMode !== contract.drawMode) {
      throw new Error(`Grout13 compiled runtime drawMode is "${contract.drawMode}", not "${options.drawMode}"`);
    }
    if (options.runtimeTarget && options.runtimeTarget !== contract.runtimeTarget) {
      throw new Error(`Grout13 compiled runtimeTarget is "${contract.runtimeTarget}", not "${options.runtimeTarget}"`);
    }
    const base = compiled.runtimeOptions || {};
    return {
      functionName: options.functionName || base.functionName || "grout13",
      terse: options.terse !== void 0 ? options.terse === true : base.terse === true,
      frameMode: contract.frameMode,
      drawMode: contract.drawMode,
      runtimeTarget: contract.runtimeTarget || "canvas",
      requireCanvas: options.requireCanvas !== void 0 ? options.requireCanvas === true : base.requireCanvas === true
    };
  }
  function createGrout13RuntimeSourceFromCompiled(compiled, options = {}) {
    return createGrout13RuntimeSource(getCompiledRuntimeOptions(compiled, options));
  }
  function createGrout13BundleSourceFromCompiled(compiled, options = {}) {
    if (!compiled || typeof compiled !== "object" || !Array.isArray(compiled.payload)) {
      throw new Error("Grout13 compiled atlas is required");
    }
    const base = compiled.bundleOptions || {};
    return createGrout13BundleSource(compiled.payload, {
      payloadName: options.payloadName || base.payloadName || "G13",
      module: options.module === true,
      ...getCompiledRuntimeOptions(compiled, options)
    });
  }
  function escapeGrout13InlineScriptSource(source) {
    return String(source).replace(/<\/script/gi, "<\\/script");
  }
  function getGrout13PayloadBytes(payload) {
    return utf8Bytes(JSON.stringify(payload));
  }
  function buildGrout13CompiledCandidate(frames, options, atlas) {
    const runtimeFrameMode = options.runtimeFrameMode || "object";
    const runtimeTarget = options.runtimeTarget || "canvas";
    if (runtimeTarget !== "canvas" && runtimeTarget !== "rgba" && runtimeTarget !== "indexed") {
      throw new Error('Grout13 runtimeTarget must be "canvas", "rgba", or "indexed"');
    }
    if (runtimeTarget !== "canvas" && options.requireCanvas === true) {
      throw new Error("Grout13 byte-buffer runtime targets cannot require a canvas");
    }
    if (runtimeFrameMode === "raw" && options.includeNames === true && options.forceIncludeNames !== true) {
      throw new Error("Grout13 raw runtimeFrameMode omits frame names; pass includeNames: false or forceIncludeNames: true");
    }
    const includeNames = runtimeFrameMode === "raw" && options.includeNames === void 0 ? false : options.includeNames !== false;
    const palette = normalizePalette(options.palette) || collectPaletteFromRgba(atlas.rgba);
    const indexed = indexRgba(atlas.rgba, palette);
    const { frameOrder, frameIndexMap } = createFrameIndexMetadata(atlas.frames);
    const frameData = [];
    const metadataData = [];
    for (const frame of atlas.frames) {
      frameData.push(frame.x, frame.y, frame.width, frame.height);
      metadataData.push(
        frame.sourceWidth || frame.width,
        frame.sourceHeight || frame.height,
        frame.trim ? frame.trim.x : 0,
        frame.trim ? frame.trim.y : 0,
        frame.trim ? frame.trim.width : frame.width,
        frame.trim ? frame.trim.height : frame.height,
        frame.pivot ? frame.pivot.x : null,
        frame.pivot ? frame.pivot.y : null
      );
    }
    const namesText = atlas.frames.map((frame) => frame.name).join("|");
    const assembleCompiled = (runtimeDrawMode) => {
      const rowBoundOpaque = runtimeDrawMode === "row" || options.rowBoundOpaque === true;
      const encoderId = rowBoundOpaque ? "row-run-rle" : "atlas-rle";
      const encoded = encodeGrout13Runs(indexed, {
        rowBoundOpaque,
        width: atlas.width
      });
      const runtimeOptions = {
        functionName: options.functionName || "grout13",
        terse: options.terseRuntime === true,
        frameMode: runtimeFrameMode,
        drawMode: runtimeDrawMode,
        runtimeTarget,
        requireCanvas: options.requireCanvas === true
      };
      const bundleOptions = {
        payloadName: options.payloadName || "G13",
        ...runtimeOptions
      };
      const runtimeContract = {
        formatVersion: GROUT13_FORMAT_VERSION,
        encoderId,
        runEncoding: encoderId,
        drawMode: runtimeDrawMode,
        frameMode: runtimeFrameMode,
        runtimeTarget,
        includeNames,
        rowBoundOpaque,
        optimizeLayout: false,
        layoutId: null
      };
      const payload = [
        atlas.width,
        atlas.height,
        paletteToHexString(palette),
        encoded,
        frameData
      ];
      if (includeNames) {
        payload.push(namesText);
      }
      if (runtimeFrameMode === "metadata") {
        if (!includeNames) payload.push("");
        payload.push(metadataData);
      }
      const runtimeSource = createGrout13RuntimeSource(runtimeOptions);
      const bundleSource = createGrout13BundleSource(payload, bundleOptions);
      return {
        payload,
        atlas,
        frames: atlas.frames.map((frame) => ({ ...frame })),
        frameOrder,
        frameIndexMap,
        palette,
        indexed,
        encoded,
        runtimeContract,
        runtimeOptions,
        bundleOptions,
        runtimeSource,
        bundleSource,
        bytes: {
          payload: getGrout13PayloadBytes(payload),
          runtime: utf8Bytes(runtimeSource),
          bundle: utf8Bytes(bundleSource)
        }
      };
    };
    return assembleCompiled(options.runtimeDrawMode || (options.rowBoundOpaque === true ? "row" : "pixel"));
  }
  function compileGrout13Atlas(assets, options = {}) {
    if (!Array.isArray(assets) || assets.length === 0) {
      throw new Error("compileGrout13Atlas requires at least one asset");
    }
    const researchOptions = [
      "analyzeEncoders",
      "optimizeEncoder",
      "encoderCandidates",
      "encoderScorer",
      "optimizeLayout",
      "layoutSearchWidths",
      "layoutSearchOrders",
      "layoutSearchMaxColumns",
      "layoutScorer"
    ];
    const requestedResearchOption = researchOptions.find((key) => options[key] !== void 0);
    if (requestedResearchOption) {
      throw new Error(`Grout13 research option "${requestedResearchOption}" is only available from ./grout13/research.js`);
    }
    preflightGrout13Assets(assets);
    const renderStrict = options.strict !== false;
    const frames = assets.map((asset, index) => renderAssetToRgbaFrame(asset, index, { strict: renderStrict }));
    const atlasOptions = {
      ...DEFAULT_GROUT13_ATLAS_OPTIONS,
      ...options.atlasOptions || {}
    };
    const atlas = buildSinglePageAtlas(frames, atlasOptions);
    return buildGrout13CompiledCandidate(frames, options, atlas);
  }
  return __toCommonJS(grout13_exports);
})();
