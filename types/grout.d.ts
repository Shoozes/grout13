/**
 * Grout Render Library
 * TypeScript type declarations
 */

/**
 * Default color palette in RGB24 format (0xRRGGBB).
 */
export declare const DEFAULT_PALETTE_RGB24: number[];

/**
 * Default color palette in RGBA32 format (0xRRGGBBAA).
 */
export declare const DEFAULT_PALETTE_RGBA32: number[];

export type GroutColor = number;
export type GroutNumberRange = [number, number] | { min: number; max: number };
export type GroutNumericValue = number | GroutNumberRange;
export interface GroutShift {
    x?: number;
    y?: number;
}

export type GroutStepType =
    | 'fill' | 'flood_fill' | 'plot' | 'line' | 'rect' | 'rect_filled'
    | 'circle' | 'circle_filled' | 'sprite' | 'sprite_packed' | 'multi_plot'
    | 'polyline' | 'bezier_cubic' | 'bezier_quadratic' | 'gradient'
    | 'linear_gradient' | 'radial_gradient' | 'path' | 'path_segments'
    | 'bitmap_text' | 'filter' | 'heart' | 'heart_filled'
    | 'shield' | 'shield_filled';

export type GroutStepShorthand =
    | 'f' | 'ff' | 'p' | 'l' | 'r' | 'rf' | 'c' | 'cf' | 's' | 'sp'
    | 'm' | 'mp' | 'pl' | 'ml' | 'bc' | 'bq' | 'lg' | 'rg' | 'ps'
    | 'bt' | 'flt' | 'h' | 'hf' | 'sh' | 'shf';

export interface GroutGradientStop {
    offset: number;
    col: GroutColor;
    colorVariation?: GroutColor[];
    offsetVariation?: GroutNumberRange;
}

export type GroutCompactDrawTuple = [GroutStepShorthand | GroutStepType, ...number[]];
export type GroutCompactDrawStream = GroutCompactDrawTuple[];

/**
 * A drawing step in a Grout specification.
 * Supports full runtime protocol fields and compact shorthand aliases.
 */
export interface GroutStep {
    type?: GroutStepType | GroutStepShorthand;
    t?: GroutStepType | GroutStepShorthand;
    col?: GroutColor;
    c?: GroutColor;
    color?: GroutColor;
    x?: GroutNumericValue;
    y?: GroutNumericValue;
    w?: GroutNumericValue;
    h?: GroutNumericValue;
    width?: number;
    height?: number;
    r?: GroutNumericValue;
    radius?: number;
    size?: GroutNumericValue;
    x1?: GroutNumericValue;
    y1?: GroutNumericValue;
    x2?: GroutNumericValue;
    y2?: GroutNumericValue;
    cx?: GroutNumericValue;
    cy?: GroutNumericValue;
    cp1x?: GroutNumericValue;
    cp1y?: GroutNumericValue;
    cp2x?: GroutNumericValue;
    cp2y?: GroutNumericValue;
    cpx?: GroutNumericValue;
    cpy?: GroutNumericValue;
    data?: number[] | string;
    d?: number[] | string;
    packed?: string;
    packedWidth?: number;
    packedHeight?: number;
    pw?: number;
    ph?: number;
    points?: number[];
    p?: number[];
    s?: GroutPathSegment[] | number[];
    text?: string;
    font?: string;
    fontId?: string;
    fontOffset?: number;
    lineHeight?: number;
    scale?: number;
    tracking?: number;
    align?: 'left' | 'center' | 'right';
    colStart?: GroutColor;
    colEnd?: GroutColor;
    stops?: GroutGradientStop[];
    steps?: number;
    effect?: 'blur' | 'sharpen' | 'pixelate';
    strength?: number;
    blockSize?: number;
    blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'add';
    layer?: string;
    probability?: number;
    groupProbability?: number;
    colorVariation?: GroutColor[];
    xVariation?: GroutNumberRange;
    yVariation?: GroutNumberRange;
    scaleVariation?: GroutNumberRange;
    repeatVariation?: GroutNumberRange;
    shift?: GroutShift;
    _pathString?: string;
    _segments?: GroutPathSegment[];
}

/**
 * A frame containing drawing steps.
 */
export interface GroutFrame {
    steps?: GroutStep[];
    d?: GroutStep[] | GroutCompactDrawStream;
}

/**
 * Sequence item for animation with modifiers.
 * Supports flip, rotation, hue shift, outline, and ordered modifiers.
 */
export type GroutSequenceItem = number | {
    i: number;
    fx?: boolean;           // Flip horizontally
    fy?: boolean;           // Flip vertically
    rot?: 90 | 180 | 270;   // Rotation in degrees
    hue?: number;           // Hue shift in degrees
    outline?: boolean | {   // Outline effect
        color?: number;     // Outline color (default: 0)
        thickness?: number; // Outline thickness (default: 1)
    };
    mods?: string[];        // Ordered modifiers (e.g., ['fx', 'rot90', 'hue30', 'outline'])
    rotationVariation?: number[];
};

/**
 * Grout specification object.
 */
export interface GroutSpec {
    w?: number;
    h?: number;
    fps?: number;
    fpsVariation?: GroutNumberRange;
    frames?: GroutFrame[];
    steps?: GroutStep[];
    d?: GroutStep[] | GroutCompactDrawStream;
    draw?: GroutCompactDrawStream;
    sequence?: GroutSequenceItem[];
    palette?: number[];
    customPalette?: number[];
    pal?: number[];
}

/**
 * Bounding box for transformations.
 */
export interface GroutBounds {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Rendering options.
 */
export interface RenderOptions {
    previewStep?: GroutStep;
    palette?: number[];
    layerProbabilities?: Record<string, number>;
    stepCache?: boolean;
}

/**
 * Resolved sequence item with all modifiers.
 */
export interface ResolvedSeqItem {
    frameIndex: number;
    fx: boolean;
    fy: boolean;
    rot: number;
    hue: number;
    outline: boolean | { color: number; thickness: number } | null;
    mods: string[];
}

/**
 * Render result with buffer and optional modified dimensions/palette.
 */
export interface RenderResult {
    buffer: Int32Array;
    w: number;
    h: number;
    palette?: number[];
    dirtyRect?: { x: number; y: number; w?: number; h?: number; width?: number; height?: number } | null;
}

/**
 * HSL color values.
 */
export interface HSLColor {
    h: number;  // Hue (0-360)
    s: number;  // Saturation (0-1)
    l: number;  // Lightness (0-1)
}

/**
 * Parsed modifier result.
 */
export interface ParsedModifier {
    type: 'fx' | 'fy' | 'rot' | 'hue';
    value: number | boolean;
}

/**
 * Normalizes and validates a Grout specification object, applying defaults where needed.
 */
export declare function normalizeSpec(input: Partial<GroutSpec>): GroutSpec;

/**
 * Normalizes a step object, converting shorthand notation to full notation.
 */
export declare function normalizeStep(step: GroutStep): GroutStep;

/**
 * Resolves a sequence item to get the frame index and all modifiers.
 */
export declare function resolveSeqItem(spec: GroutSpec, seqIndex: number): ResolvedSeqItem;

/**
 * Renders a Grout specification to an index buffer.
 * Returns a RenderResult object with Int32Array buffer and dimensions.
 */
export declare function renderIndexBuffer(
    specInput: Partial<GroutSpec>,
    seqIndex?: number,
    opts?: RenderOptions
): Int32Array | RenderResult;

/**
 * Tests if a coordinate hits a drawing step.
 */
export declare function hitsStepPixel(step: GroutStep, x: number, y: number): boolean;

/**
 * Transforms an array of drawing steps by applying flip or rotation operations.
 */
export declare function transformSteps(
    steps: GroutStep[],
    op: 'flip-h' | 'flip-v' | 'rot-cw' | 'rot-ccw',
    bounds: GroutBounds
): void;

/**
 * Legacy helper function for flipping steps.
 * @deprecated Use transformSteps directly for more control
 */
export declare function flipStepsInPlace(
    steps: GroutStep[],
    axis: 'x' | 'y',
    w: number,
    h: number
): void;

/**
 * Bakes a rendered frame into a single sprite step.
 */
export declare function bakeToSpriteStep(
    specInput: Partial<GroutSpec>,
    seqIndex?: number
): GroutStep;

/**
 * Converts raw RGBA image data to a Grout sprite step using color quantization.
 */
export declare function quantizeImageDataToSpriteStep(
    imgData: Uint8ClampedArray,
    w: number,
    h: number,
    paletteRgb24?: number[],
    alphaThreshold?: number
): GroutStep;

export interface ImageToGroutOptions {
    maxColors?: number | null;
    palette?: number[];
    alphaThreshold?: number;
    dither?: 'none' | 'floyd-steinberg';
    collapse?: boolean;
    usePacking?: boolean;
}

/**
 * Converts RGBA image data into a one-frame Grout specification.
 * Defaults to a 16-color median-cut palette and color-grouped multi_plot steps.
 */
export declare function imageDataToGroutSpec(
    imageData: ImageData | Uint8ClampedArray | number[],
    widthOrOptions?: number | ImageToGroutOptions,
    height?: number,
    options?: ImageToGroutOptions
): GroutSpec;

/** Default maximum palette size used by imageDataToGroutSpec. */
export declare const DEFAULT_IMAGE_MAX_COLORS: 16;

// ============================================================================
// Color Manipulation Utilities
// ============================================================================

/**
 * Converts RGB24 color to HSL values.
 */
export declare function rgb24ToHsl(rgb24: number): HSLColor;

/**
 * Converts HSL values to RGB24 color.
 */
export declare function hslToRgb24(h: number, s: number, l: number): number;

/**
 * Shifts the hue of an RGB24 color by a given amount.
 */
export declare function shiftHue(rgb24: number, hueShift: number): number;

/**
 * Applies hue shift to an entire palette.
 */
export declare function shiftPaletteHue(palette: number[], hueShift: number): number[];

/**
 * Rotates an index buffer by 90, 180, or 270 degrees.
 */
export declare function rotateBuffer(
    buffer: Int32Array,
    w: number,
    h: number,
    degrees: 90 | 180 | 270
): { buffer: Int32Array; w: number; h: number };

/**
 * Flips an index buffer horizontally or vertically.
 */
export declare function flipBuffer(
    buffer: Int32Array,
    w: number,
    h: number,
    flipX: boolean,
    flipY: boolean
): Int32Array;

/**
 * Applies an outline effect to an index buffer.
 * Detects edges and draws outline around non-transparent pixels.
 */
export declare function outlineBuffer(
    buffer: Int32Array,
    w: number,
    h: number,
    color?: number,
    thickness?: number
): Int32Array;

/**
 * Parses a modifier string into its type and value.
 */
export declare function parseModifier(mod: string): ParsedModifier | null;

// ============================================================================
// RGBA Color Constructors
// ============================================================================

/**
 * Creates an RGB24 color value from components.
 */
export declare function rgb(r: number, g: number, b: number): number;

/**
 * Creates an RGB24 color value from normalized components.
 */
export declare function rgbNormalized(r: number, g: number, b: number): number;

/**
 * Creates an RGBA32 color value from components.
 */
export declare function rgba(r: number, g: number, b: number, a: number): number;

/**
 * Creates an RGBA32 color value from normalized components.
 */
export declare function rgbaNormalized(r: number, g: number, b: number, a: number): number;

/**
 * Creates a color value from 1-4 components. Alias for flexible color construction.
 */
export declare function vec(r: number, g?: number, b?: number, a?: number): number;

/** Alias for rgb() */
export declare const vec3: typeof rgb;

/** Alias for rgba() */
export declare const vec4: typeof rgba;

/**
 * Extracts RGBA components from an RGBA32 value.
 */
export declare function toRgba(rgba32: number): { r: number; g: number; b: number; a: number };

/** Alias for toRgba() */
export declare const toVec4: typeof toRgba;

/**
 * Extracts RGB components from an RGB24 value.
 */
export declare function toRgb(rgb24: number): { r: number; g: number; b: number };

/** Alias for toRgb() */
export declare const toVec3: typeof toRgb;

/**
 * Converts RGB24 to RGBA32 with optional alpha.
 */
export declare function rgb24ToRgba32(rgb24: number, alpha?: number): number;

/**
 * Converts RGBA32 to RGB24 (discards alpha).
 */
export declare function rgba32ToRgb24(rgba32: number): number;

// ============================================================================
// Path/Bezier Utilities
// ============================================================================

/**
 * Parses an SVG-like path string into Grout steps.
 */
export declare function parsePathString(pathData: string, col?: number): GroutStep[];

/**
 * Converts Grout steps to an SVG path string.
 */
export declare function stepsToPathString(steps: GroutStep[], useRelative?: boolean): string;

/**
 * Optimizes bezier steps by removing redundant control points.
 */
export declare function optimizeBezierSteps(steps: GroutStep[], tolerance?: number): GroutStep[];

export type GroutPathSegment =
    | [number, number]
    | [number, number, number, number]
    | [number, number, number, number, number, number];

/**
 * Parses path segments into Grout steps.
 */
export declare function parseSegments(segments: GroutPathSegment[], col?: number): GroutStep[];

// ============================================================================
// Renderer
// ============================================================================

export type RendererBackend = 'canvas' | 'webgl' | 'webgpu';
export type RendererFeature = 'customShader';

export interface RendererCustomShader {
    webglColorExpression?: string;
    wgslColorExpression?: string;
}

export interface RendererFactoryOptions {
    preferredBackend?: RendererBackend;
    fallbackChain?: RendererBackend[];
    minBackend?: RendererBackend;
    requiredFeatures?: RendererFeature[];
    canvas?: HTMLCanvasElement | null;
}

export interface RendererDrawOptions {
    enableAlphaBlending?: boolean;
    customShader?: RendererCustomShader | null;
}

export interface RendererSupport {
    canvas: boolean;
    webgl: boolean;
    webgpu: boolean;
}

export interface RendererInfo {
    name: RendererBackend | string;
    support: RendererSupport;
    recommended: RendererBackend | string;
}

export interface NormalizedRenderInput {
    indices: Int32Array | Int16Array;
    width: number;
    height: number;
    palette: number[];
}

export interface NormalizedGpuPaletteData {
    textureData: Uint8Array;
    remappedPalette: number[];
    rgba32Slots: Set<number>;
}

export declare class BaseRenderer {
    readonly name: string;
    initialized: boolean;
    canvas: HTMLCanvasElement | null;
    constructor(name: string);
    normalizeRenderInput(indices: Int32Array | Int16Array | RenderResult, width?: number, height?: number, palette?: number[]): NormalizedRenderInput;
    normalizeGpuPaletteData(indices: Int32Array | Int16Array | number[], palette: number[]): NormalizedGpuPaletteData;
    buildGpuPaletteUniforms(remappedPalette: number[], rgba32Slots?: Set<number>): Float32Array;
    buildCanvasPaletteBuffer(palette: number[]): Uint32Array;
    resolveCustomShader(options?: RendererDrawOptions, backend?: RendererBackend): { key: string; expression: string | null };
    validateCustomShaderExpression(expression: string, field: string): void;
    isSupported(): Promise<boolean>;
    initialize(canvas: HTMLCanvasElement): Promise<void>;
    render(indices: Int32Array | Int16Array | RenderResult, width?: number, height?: number, palette?: number[], options?: RendererDrawOptions): void | Promise<void>;
    dispose(): void | Promise<void>;
    on(event: string, callback: (data?: object | null) => void): void;
    off(event: string, callback: (data?: object | null) => void): void;
    getName(): string;
    isInitialized(): boolean;
}

export declare class CanvasRenderer extends BaseRenderer {
    constructor();
}

export declare class WebGLRenderer extends BaseRenderer {
    constructor();
}

export declare class WebGPURenderer extends BaseRenderer {
    constructor();
    renderToRgba(indices: Int32Array | Int16Array | RenderResult, width?: number, height?: number, palette?: number[], options?: RendererDrawOptions): Promise<Uint8ClampedArray>;
}

/**
 * Renders an index buffer to an HTML canvas element.
 * Supports both Int32Array and RenderResult input.
 */
export declare function drawIndexBufferToCanvas(
    canvas: HTMLCanvasElement,
    w: number,
    h: number,
    indicesOrResult: Int32Array | RenderResult,
    paletteRgb24?: number[],
    options?: RendererDrawOptions
): void;

export declare function createRenderer(options?: RendererFactoryOptions): Promise<BaseRenderer>;
export declare function calculateComplexity(spec: GroutSpec): number;
export interface RendererRecommendation { complexity: number; tier: 'canvas' | 'webgl' | 'webgpu'; fallbackChain: Array<'canvas' | 'webgl' | 'webgpu'>; minBackend: 'webgl' | null; reasons: string[]; activeFrameIndex: number; activeFramePrimitives: number; packedPixels: number; canvasPixels: number; uploadFrequency: number; }
export declare function getRendererRecommendation(spec: GroutSpec): RendererRecommendation;
export declare function getRecommendedRenderer(spec: GroutSpec, options?: RendererFactoryOptions): Promise<BaseRenderer>;
export declare function checkRendererSupport(): Promise<RendererSupport>;
export declare function getRendererInfo(): Promise<RendererInfo>;

// ============================================================================
// SVG Converter
// ============================================================================

/**
 * RGB color components.
 */
export interface RGBColor {
    r: number;  // Red (0-255)
    g: number;  // Green (0-255)
    b: number;  // Blue (0-255)
}

export interface ColorPaletteOptions {
    colorCount?: number;
    quality?: number;
    withSemanticNames?: boolean;
    alphaThreshold?: number;
}

export interface SemanticColor extends RGBColor {
    hex: string;
    name: string;
    distance: number;
}

/**
 * Parsed SVG path command.
 */
export interface SvgPathCommand {
    cmd: string;  // Command letter (M, L, H, V, C, S, Q, T, A, Z)
    args: number[];  // Numeric arguments
}

/**
 * Parsed SVG data structure.
 */
export interface ParsedSvgChild {
    tagName: string;
    getAttribute?: (name: string) => string | null;
    [attribute: string]: string | ((name: string) => string | null) | undefined;
}

export interface ParsedSvgData {
    width: number;
    height: number;
    viewBoxMinX: number;
    viewBoxMinY: number;
    isPixelArt: boolean;
    children: ParsedSvgChild[];
}

/**
 * SVG to Grout conversion options.
 */
export interface SvgToGroutOptions {
    palette?: number[];  // Color palette to use
    scale?: number;      // Scale factor (default: 1)
}

/**
 * Grout to SVG conversion options.
 */
export interface GroutToSvgOptions {
    palette?: number[];       // Color palette to use
    seqIndex?: number;        // Sequence index to render (default: 0)
    stroke?: string;          // Default stroke color (default: 'currentColor')
    strokeWidth?: number;     // Stroke width (default: 2)
    strokeLinecap?: string;   // Stroke linecap (default: 'round')
    strokeLinejoin?: string;  // Stroke linejoin (default: 'round')
}

/**
 * Finds the closest color index in the palette for a given color.
 */
export declare function findClosestColorIndex(colorStr: string, palette?: number[]): number;

/**
 * Parses a color string to RGB components.
 */
export declare function parseColor(colorStr: string): RGBColor | null;

/**
 * Converts an RGB24 color to hex string.
 */
export declare function rgb24ToHex(rgb24: number): string;

export declare function hexToRgb(hex: string): RGBColor;
export declare function rgbToHex(r: number, g: number, b: number): string;
export declare function getColorKey(red: number, green: number, blue: number, colorVariation: number): string;
export declare function getClosestColor(colors: number[][], red: number, green: number, blue: number): number[];
export declare function getClosestColorAlternative(colors: number[][], red: number, green: number, blue: number, colorVariation: number): number[];
export declare function getKNearestNeighborColor(colors: number[][], red: number, green: number, blue: number, colorVariation: number): number[];
export declare function getHslColor(colors: number[][], red: number, green: number, blue: number): number[];
export declare function createPixelArray(imgData: Uint8ClampedArray | number[], quality?: number, options?: Pick<ColorPaletteOptions, 'alphaThreshold'>): number[][];
export declare function validateOptions(options?: ColorPaletteOptions): Required<ColorPaletteOptions>;
export declare function getColor(img: string, options?: ColorPaletteOptions): Promise<number[] | SemanticColor>;
export declare function getPalette(img: string, options?: ColorPaletteOptions): Promise<Array<number[] | SemanticColor>>;
export declare function getPalette(img: string, colorCount?: number, quality?: number, options?: ColorPaletteOptions): Promise<Array<number[] | SemanticColor>>;
export declare function meanColor(colors: number[][]): number[];
export declare function sortColors(pixelArray: number[][], colorCount?: number): number[][];
export declare function getLuminance(color: number[]): number;
export declare function getPerceivedBrightness(color: number[]): number;

/**
 * Parses SVG path 'd' attribute into an array of commands.
 */
export declare function parseSvgPath(d: string): SvgPathCommand[];

/**
 * Converts SVG path commands to Grout steps.
 */
export declare function pathCommandsToGroutSteps(
    pathCommands: SvgPathCommand[],
    colorIndex?: number,
    strokeWidth?: number
): GroutStep[];

/**
 * Parses an SVG element and converts it to Grout steps.
 */
export declare function svgElementToSteps(
    svgElement: Element | ParsedSvgChild,
    options?: { palette?: number[]; strokeColorIndex?: number; fillColorIndex?: number }
): GroutStep[];

/**
 * Parses an SVG string into a simple object with dimensions and children.
 */
export declare function parseSvgString(svgString: string): ParsedSvgData;

/**
 * Converts an SVG string or element to a Grout specification.
 */
export declare function svgToGrout(svg: string | Element, options?: SvgToGroutOptions): GroutSpec;

/**
 * Converts a Grout specification to an SVG string.
 */
export declare function groutToSvg(spec: GroutSpec, options?: GroutToSvgOptions): string;

/**
 * Creates a compact Grout spec using shorthand notation.
 */
export declare function compactGroutSpec(spec: GroutSpec): GroutSpec;

/**
 * Converts SVG to compact Grout JSON string.
 */
export declare function svgToGroutJson(svg: string | Element, options?: SvgToGroutOptions): string;

/**
 * Flattens multiple layers into a packed sprite with compression.
 */
export declare function flattenLayersToPackedSprite(
    steps: GroutStep[],
    selectedIndices: number[],
    canvasWidth: number,
    canvasHeight: number,
    options?: { usePacking?: boolean }
): GroutSpec;

/**
 * Optimizes a Grout spec for maximum compression.
 * Combines layer flattening by color with compact notation and sprite packing.
 */
export declare function optimizeSpec(
    spec: GroutSpec,
    options?: { usePacking?: boolean; flattenByColor?: boolean }
): GroutSpec;

// ============================================================================
// Sprite Packing
// ============================================================================

/**
 * Packs an array of bits (0/1) into a hex string.
 */
export declare function packBits(bits: number[]): string;

/**
 * Unpacks a hex string back into an array of bits.
 */
export declare function unpackBits(hex: string, expectedLength?: number): number[] | null;

/**
 * Compresses a hex string using run-length encoding.
 */
export declare function compressHex(hex: string): string;

/**
 * Decompresses a run-length encoded string.
 */
export declare function decompressHex(compressed: string, options?: { maxOutputLength?: number }): string;

/**
 * Compresses a multi_plot coordinate array into packed format.
 */
export declare function compressMultiPlot(data: number[], w?: number, h?: number): string;

/**
 * Decompresses packed format back to coordinate array.
 */
export declare function decompressMultiPlot(compressed: string, w?: number, h?: number): number[] | null;

/**
 * Analyzes compression efficiency for a given data array.
 */
export declare function analyzeCompression(data: number[], w?: number): { originalSize: number; compressedSize: number; savings: number; worthwhile: boolean; compressionRatio: string };

/** Code golfing alias for packBits */
export declare const pk: typeof packBits;
/** Code golfing alias for unpackBits */
export declare const up: typeof unpackBits;
/** Code golfing alias for compressMultiPlot */
export declare const cp: typeof compressMultiPlot;
/** Code golfing alias for decompressMultiPlot */
export declare const dc: typeof decompressMultiPlot;
/** Code golfing alias for analyzeCompression */
export declare const az: typeof analyzeCompression;

// ============================================================================
// Variation Engine
// ============================================================================

/**
 * Creates a seeded random number generator.
 */
export interface SeededRandom {
    next(): number;
    nextInt(min: number, max: number): number;
    nextFloat(min: number, max: number): number;
}

export interface VariationLayerOptions {
    layerProbabilities?: Record<string, number>;
}

export interface GenerateVariationOptions extends VariationLayerOptions {
    seed?: number;
    mirrorX?: boolean;
    mirrorY?: boolean;
}

export interface GenerateMultipleVariationsOptions extends VariationLayerOptions {
    baseSeed?: number;
    mirrorX?: boolean;
    mirrorY?: boolean;
}

export interface VariationTemplateLayerConfig {
    name: string;
    probability: number;
}

export interface VariationTemplateConfig {
    probabilisticLayers?: VariationTemplateLayerConfig[];
    geometricRanges?: Record<number, Partial<GroutStep>>;
    colorVariations?: Record<number, GroutColor[]>;
}

export interface MutateVariationOptions {
    seed?: number;
    colorMutation?: number;
    positionMutation?: number;
    paletteSize?: number;
}

export type VariationConfig =
    | GenerateVariationOptions
    | GenerateMultipleVariationsOptions
    | VariationTemplateConfig
    | MutateVariationOptions;

export interface VariationHistoryEntry {
    spec: GroutSpec;
    config: VariationConfig;
    isFavorite: boolean;
    timestamp: number;
}

export declare function createSeededRandom(seed?: number): SeededRandom;

/**
 * Applies probabilistic step selection.
 */
export declare function applyProbabilisticSteps(steps: GroutStep[], random: SeededRandom, options?: VariationLayerOptions): GroutStep[];

/**
 * Applies geometric variation to steps.
 */
export declare function applyGeometricVariation(steps: GroutStep[], random: SeededRandom): GroutStep[];

/**
 * Applies color variation to steps.
 */
export declare function applyColorVariation(steps: GroutStep[], random: SeededRandom, palette?: GroutColor[]): GroutStep[];

/**
 * Applies mirroring to steps.
 */
export declare function applyMirroring(steps: GroutStep[], width: number, height: number, mirrorX?: boolean, mirrorY?: boolean): GroutStep[];

/**
 * Applies animation timing variation to a spec.
 */
export declare function applyTimingVariation(spec: GroutSpec, random: SeededRandom): GroutSpec;

/**
 * Applies rotation variation to sequence items.
 */
export declare function applyRotationVariation(sequence: GroutSequenceItem[], random: SeededRandom): GroutSequenceItem[];

/**
 * Applies scale variation to steps and clamps geometry to canvas bounds.
 */
export declare function applyScaleVariation(steps: GroutStep[], random: SeededRandom, width: number, height: number): GroutStep[];

/**
 * Applies gradient stop variation.
 */
export declare function applyGradientVariation(steps: GroutStep[], random: SeededRandom): GroutStep[];

/**
 * Applies repetition variation, optionally clamping coordinates to canvas bounds.
 */
export declare function applyRepetitionVariation(steps: GroutStep[], random: SeededRandom, width?: number, height?: number): GroutStep[];

export declare class VariationHistory {
    constructor(options?: { maxSize?: number });
    add(spec: GroutSpec, config?: VariationConfig): number;
    get(index: number): VariationHistoryEntry | undefined;
    all(): VariationHistoryEntry[];
    favorites(): VariationHistoryEntry[];
    favorite(index: number): boolean;
    unfavorite(index: number): boolean;
    clear(): void;
    clearAll(): void;
    readonly size: number;
}

/**
 * Applies small random mutations to an existing resolved spec.
 */
export declare function mutateVariation(spec: GroutSpec, options?: MutateVariationOptions): GroutSpec;

/**
 * Serializes variation options for reproducible sharing.
 */
export declare function serializeVariationConfig(options: VariationConfig): string;

/**
 * Deserializes a variation config string.
 */
export declare function deserializeVariationConfig(str: string): VariationConfig;

/**
 * Generates a variation of a Grout spec.
 */
export declare function generateVariation(spec: GroutSpec, options?: GenerateVariationOptions): GroutSpec;

/**
 * Generates multiple variations of a Grout spec.
 */
export declare function generateMultipleVariations(spec: GroutSpec, count: number, options?: GenerateMultipleVariationsOptions): GroutSpec[];

/**
 * Creates a variation template for procedural generation.
 */
export declare function createVariationTemplate(spec: GroutSpec, config?: VariationTemplateConfig): GroutSpec;

/**
 * Clears cached intermediate rendering buffers maintained by the step cache.
 */
export declare function clearStepCache(): void;

/**
 * Returns the current number of cached step-render entries.
 */
export declare function stepCacheSize(): number;

/**
 * Register a bitmap font atlas for bitmap_text rendering.
 */
export interface BitmapGlyph {
  columns: number[];
  width: number;
  height: number;
  advance: number;
}

export interface BitmapImageDataSource {
  data: ArrayLike<number>;
  width?: number;
  height?: number;
}

export interface BitmapImageGlyphSource {
  imageData: BitmapImageDataSource;
  width?: number;
  height?: number;
  advance?: number;
}

export type BitmapGlyphInput = number[] | Partial<BitmapGlyph> | BitmapImageGlyphSource;

export interface BitmapFontSourceDescriptor {
  glyphs: BitmapGlyphInput[] | Record<string, BitmapGlyphInput>;
  chars?: string | string[];
  fontOffset?: number;
  baseOffset?: number;
  glyphWidth?: number;
  glyphHeight?: number;
  charGap?: number;
  defaultAdvance?: number;
  advance?: number;
  lineHeight?: number;
}

export interface BitmapFontOptions {
  chars?: string | string[];
  fontOffset?: number;
  baseOffset?: number;
  glyphWidth?: number;
  glyphHeight?: number;
  charGap?: number;
  defaultAdvance?: number;
  advance?: number;
  lineHeight?: number;
  alphaThreshold?: number;
}

export interface BitmapFontDefinition {
  id: string;
  byCode: boolean;
  glyphByCode: Array<BitmapGlyph | undefined> | null;
  glyphByChar: Map<string, BitmapGlyph>;
  glyphByCodeMap: Map<number, BitmapGlyph> | null;
  fontOffset: number;
  charWidth: number;
  charHeight: number;
  defaultAdvance: number;
  lineHeight: number;
  placeholderGlyph: BitmapGlyph | null;
}

export declare function registerBitmapFontAtlas(
  fontId: string,
  fontSource: BitmapGlyphInput[] | BitmapFontSourceDescriptor,
  options?: BitmapFontOptions
): BitmapFontDefinition;

/**
 * Removes a registered bitmap font atlas. Built-in font registrations are preserved.
 */
export declare function unregisterBitmapFontAtlas(fontId: string): boolean;

/**
 * Returns a registered bitmap text font definition.
 */
export declare function getBitmapTextFont(fontId?: string): BitmapFontDefinition | null;

/**
 * Returns the list of registered bitmap text font identifiers.
 */
export declare function getBitmapTextFonts(): string[];

// ============================================================================
// Endianness Utilities
// ============================================================================

/**
 * Packs an RGB24 palette color to RGBA32 for buffer rendering.
 */
export declare function packColorToRGBA32(rgb24: number): number;

/**
 * Packs a direct RGBA32 color value for buffer rendering.
 */
export declare function packRGBA32Direct(rgba32: number): number;

/**
 * Resolves a buffer color index to an RGBA32 value.
 */
export declare function resolveBufferColor(index: number, palette: Uint32Array): number;

/**
 * True when the host platform stores typed-array 32-bit values in little-endian byte order.
 */
export declare const LITTLE_ENDIAN: boolean;

/**
 * Returns true when the palette contains internal RGBA32 entries with alpha below 255.
 */
export declare function paletteHasTransparency(palette: number[]): boolean;
