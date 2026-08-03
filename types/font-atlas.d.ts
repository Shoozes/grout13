/**
 * Grout font-atlas subpath declarations.
 */
export type RgbaBytes = Uint8ClampedArray | Uint8Array;

export interface RgbaAtlasFrameInput {
    name?: string;
    width: number;
    height: number;
    rgba: RgbaBytes;
    pivot?: Record<string, unknown>;
    animation?: Record<string, unknown>;
}

export interface RgbaAtlasFrame {
    name: string;
    page: number;
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    sourceWidth: number;
    sourceHeight: number;
    trim: { x: number; y: number; width: number; height: number };
    pivot?: Record<string, unknown>;
    animation?: Record<string, unknown>;
    u: number;
    v: number;
    uw: number;
    uh: number;
}

export interface RgbaAtlasPage {
    index: number;
    width: number;
    height: number;
    rgba: Uint8ClampedArray;
}

export interface RgbaAtlas {
    width: number;
    height: number;
    rgba: Uint8ClampedArray;
    pages: RgbaAtlasPage[];
    frames: RgbaAtlasFrame[];
    meta: { layout: 'packed' | 'grid'; padding: number; extrude: number; trim: boolean; maxWidth?: number; maxHeight?: number; pageCount: number };
}

export interface RgbaAtlasFrameMetadata {
    page: number;
    pageIndex: number;
    frame: { x: number; y: number; w: number; h: number };
    rotated: false;
    trimmed: boolean;
    spriteSourceSize: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
    uv: { u: number; v: number; u1: number; v1: number; uw: number; uh: number };
    pivot?: Record<string, unknown>;
    animation?: Record<string, unknown>;
}

export interface RgbaAtlasMetadata {
    format: 'grout-rgba-atlas';
    image: string;
    size: { w: number; h: number };
    pages: Array<{ index: number; width: number; height: number }>;
    meta: Record<string, unknown>;
    frames: Record<string, RgbaAtlasFrameMetadata>;
}

export interface PhaserAtlasMetadata {
    format: 'phaser3-json-hash' | 'phaser4-json-hash';
    frames: Record<string, RgbaAtlasFrameMetadata>;
    meta: { app: string; image: string; format: string; size: { w: number; h: number }; pages: Array<{ index: number; width: number; height: number }>; scale: string };
}

export interface ThreeAtlasFrameMetadata {
    name: string;
    page: number;
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    sourceWidth: number;
    sourceHeight: number;
    trim: { x: number; y: number; width: number; height: number };
    uv: { u: number; v: number; u1: number; v1: number; uw: number; uh: number };
    offset: { x: number; y: number };
    repeat: { x: number; y: number };
    pivot?: Record<string, unknown>;
    animation?: Record<string, unknown>;
}

export interface ThreeAtlasMetadata {
    format: 'three-uv-atlas';
    image: string;
    size: { w: number; h: number };
    pages: Array<{ index: number; width: number; height: number }>;
    frames: ThreeAtlasFrameMetadata[];
}

export interface RgbaTile {
    name: string;
    col: number;
    row: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rgba: Uint8ClampedArray;
}

export declare function loadImage(url: string, options?: { timeout?: number }): Promise<HTMLImageElement>;
export declare function clearTextureCache(url?: string | null): void;
export declare function getTextureCacheInfo(): { size: number; urls: string[] };

export interface TextureAtlasSubtexture {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    frameX: number;
    frameY: number;
    frameWidth: number;
    frameHeight: number;
}

export interface TextureAtlasMetadata {
    width?: number;
    height?: number;
    imagePath?: string;
    [key: string]: unknown;
}

export interface TextureAtlasJsonFrame {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    width?: number;
    height?: number;
    frameX?: number;
    frameY?: number;
    frameWidth?: number;
    frameHeight?: number;
    frame?: { x?: number; y?: number; w?: number; h?: number };
    spriteSourceSize?: { x?: number; y?: number };
    sourceSize?: { w?: number; h?: number };
}

export interface TextureAtlasData {
    meta?: TextureAtlasMetadata;
    frames?: Record<string, TextureAtlasJsonFrame>;
    sprites?: Record<string, TextureAtlasJsonFrame>;
}

export declare class TextureAtlas {
    image: HTMLImageElement | HTMLCanvasElement | null;
    subtextures: Map<string, TextureAtlasSubtexture>;
    metadata: TextureAtlasMetadata;
    loadFromXML(xmlUrl: string, imageUrl: string): Promise<this>;
    loadFromJSON(jsonUrl: string, imageUrl: string): Promise<this>;
    loadFromData(data: TextureAtlasData, image: HTMLImageElement | HTMLCanvasElement): this;
    getSubtexture(name: string): TextureAtlasSubtexture | null;
    getSubtextureNames(): string[];
    extractToCanvas(name: string): HTMLCanvasElement | null;
    getSubtextureImageData(name: string): ImageData | null;
}

export interface SdfFontOptions {
    spread?: number;
    padding?: number;
    textureSize?: number;
}

export interface SdfGlyph {
    x: number;
    y: number;
    width: number;
    height: number;
    advance: number;
    offsetX: number;
    offsetY: number;
}

export interface SdfFontMetadata {
    size: number;
    spread: number;
    lineHeight: number;
    baseline: number;
}

export interface SdfFontJson {
    metadata: SdfFontMetadata;
    glyphs: Record<string, SdfGlyph>;
}

export declare class SDFFont {
    atlas: HTMLCanvasElement | HTMLImageElement | null;
    glyphs: Map<string, SdfGlyph>;
    metadata: SdfFontMetadata;
    generateFromFont(fontFamily: string, fontSize?: number, characters?: string | null, options?: SdfFontOptions): Promise<this>;
    getGlyph(char: string): SdfGlyph | null;
    getAtlas(): HTMLCanvasElement | null;
    exportJSON(): SdfFontJson;
    importJSON(json: Partial<SdfFontJson>, atlasImage: HTMLImageElement | HTMLCanvasElement): void;
}

export declare const SDF_VERTEX_SHADER_WEBGL: string;
export declare const SDF_FRAGMENT_SHADER_WEBGL: string;
export declare function createSDFShaderWebGL(gl: WebGLRenderingContext | WebGL2RenderingContext): WebGLProgram;
export declare const SDF_SHADER_WEBGPU: string;
export declare function isWebGPUSupported(): boolean;
export interface SpriteAtlasSource {
    type?: string;
    name?: string;
    x?: number;
    y?: number;
    w: number;
    h: number;
    data: number[];
    palette?: number[];
    customPalette?: number[];
}

export interface SpriteAtlasEntry {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    data: number[];
}

export interface CanvasSpriteAtlas {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    sprites: SpriteAtlasEntry[];
}

export interface SliceAtlasGridOptions {
    offsetX?: number;
    offsetY?: number;
    spacingX?: number;
    spacingY?: number;
    maxTiles?: number;
}

export interface CanvasAtlasTile {
    name: string;
    col: number;
    row: number;
    x: number;
    y: number;
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    imageData: ImageData;
}

export declare function groutSpriteToAtlasEntry(spriteStep: SpriteAtlasSource): SpriteAtlasEntry;
export declare function buildRgbaAtlas(frames: RgbaAtlasFrameInput[], options?: { padding?: number; extrude?: number; trim?: boolean; layout?: 'packed' | 'grid'; columns?: number; maxWidth?: number; maxHeight?: number }): RgbaAtlas;
export declare function extractAtlasFrameRgba(atlas: RgbaAtlas, frameRef: string | number): { name: string; width: number; height: number; rgba: Uint8ClampedArray; frame: RgbaAtlasFrame };
export declare function sliceRgbaAtlasGrid(source: { width: number; height: number; rgba: RgbaBytes }, tileWidth: number, tileHeight: number, options?: { offsetX?: number; offsetY?: number; spacingX?: number; spacingY?: number; maxTiles?: number; namePrefix?: string }): RgbaTile[];
export declare function exportRgbaAtlasMetadata(atlas: RgbaAtlas, options?: { image?: string }): RgbaAtlasMetadata;
export declare function exportPhaserAtlasMetadata(atlas: RgbaAtlas, options?: { image?: string; version?: 3 | 4 }): PhaserAtlasMetadata;
export declare function exportThreeAtlasMetadata(atlas: RgbaAtlas, options?: { image?: string }): ThreeAtlasMetadata;
export declare function createAtlasFromSprites(sprites: SpriteAtlasSource[], padding?: number): CanvasSpriteAtlas;
export declare function sliceAtlasGrid(image: HTMLImageElement | HTMLCanvasElement, tileWidth: number, tileHeight: number, options?: SliceAtlasGridOptions): CanvasAtlasTile[];
export declare function isTileBlank(imageData: ImageData, alphaThreshold?: number): boolean;
export interface GlyphTile {
    canvas?: HTMLCanvasElement;
    imageData: ImageData;
    advance?: number;
}

export interface GlyphMask {
    canvas: HTMLCanvasElement;
    imageData: ImageData;
    advance: number;
}

export interface TextLayoutOptions {
    fontOffset?: number;
    lineHeight?: number;
}

export interface TextMeasure {
    width: number;
    height: number;
    lines: string[];
}

export interface TextLayoutGlyph {
    char: string;
    x: number;
    y: number;
    tileIndex: number;
    timeOffset: number;
    glyphIndex: number;
}

export interface GlyphBatchOptions {
    useWebGPU?: boolean;
    useInstancing?: boolean;
    glow?: boolean;
    textMode?: string;
    palette?: unknown;
    renderer?: unknown;
    gl?: WebGLRenderingContext | WebGL2RenderingContext | null;
    gpuDevice?: unknown;
}

export interface GlyphBatchDrawOptions extends TextLayoutOptions {
    visibleGlyphs?: number;
    areaWidth?: number;
    color?: string;
}

export declare class GlyphBatch {
    constructor(opts?: GlyphBatchOptions);
    loadAtlas(glyphTiles: GlyphTile[]): Promise<void>;
    drawText(text: string, x: number, y: number, opts?: GlyphBatchDrawOptions): void;
    dispose(): void;
}
export declare function buildGlyphMask(tile: GlyphTile, lumaThreshold?: number): GlyphMask;
export declare function measureGlyphWidth(tile: GlyphTile, threshold?: number): number;
export declare function glyphAdvance(ch: string, glyphTiles: GlyphTile[], fontOffset?: number): number;
export declare function measureWord(word: string, glyphTiles: GlyphTile[], fontOffset?: number): number;
export declare function measureText(text: string, glyphTiles: GlyphTile[], areaWidth: number, options?: TextLayoutOptions): TextMeasure;
export declare function layoutText(text: string, visibleCount: number, originX: number, originY: number, areaWidth: number, glyphTiles: GlyphTile[], options?: TextLayoutOptions): TextLayoutGlyph[];
export declare function renderTextInArea(ctx: CanvasRenderingContext2D, text: string, visibleCount: number, x: number, y: number, w: number, glyphTiles: GlyphTile[], color: string, options?: TextLayoutOptions): void;
export declare function drawNineSlice(ctx: CanvasRenderingContext2D, image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number, cw: number, ch: number): void;
