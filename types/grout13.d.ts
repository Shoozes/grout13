/**
 * Grout13 compiler/runtime v1 facade declarations.
 *
 * Encoder candidates, layout scorers, and low-level source/codec helpers are
 * repo-local research APIs and are intentionally not declared here.
 */
import type { GroutSpec } from './grout';
import type { RgbaAtlas, RgbaAtlasFrame } from './font-atlas';

export declare const GROUT13_FORMAT_VERSION: 1;
export declare const DEFAULT_GROUT13_ATLAS_OPTIONS: Readonly<{
    layout: 'packed';
    padding: 0;
    extrude: 0;
    trim: true;
    maxWidth: 512;
    maxHeight: 512;
}>;

export type Grout13FrameMetadataData = Array<number | null>;
export type Grout13Payload = [number, number, string, string, number[], string?, Grout13FrameMetadataData?];

export interface Grout13AssetInput {
    name?: string;
    spec: GroutSpec;
    pivot?: { x: number; y: number };
    animation?: Record<string, unknown>;
}

export interface Grout13AtlasOptions {
    layout?: 'packed' | 'grid';
    padding?: number;
    extrude?: number;
    trim?: boolean;
    columns?: number;
    maxWidth?: number;
    maxHeight?: number;
}

export interface Grout13CompileOptions {
    palette?: number[];
    includeNames?: boolean;
    forceIncludeNames?: boolean;
    atlasOptions?: Grout13AtlasOptions;
    payloadName?: string;
    functionName?: string;
    terseRuntime?: boolean;
    runtimeFrameMode?: 'object' | 'metadata' | 'raw';
    runtimeDrawMode?: 'pixel' | 'row';
    runtimeTarget?: 'canvas' | 'rgba' | 'indexed';
    rowBoundOpaque?: boolean;
    requireCanvas?: boolean;
}

export interface Grout13FrameRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Grout13FrameMetadata extends Grout13FrameRect {
    sourceSize: { w: number; h: number };
    spriteSourceSize: { x: number; y: number; w: number; h: number };
    pivot?: { x: number; y: number };
}

export interface Grout13DecodedAtlas {
    width: number;
    height: number;
    palette: number[];
    indexed: Uint8Array;
    rgba: Uint8ClampedArray;
    canvas: HTMLCanvasElement | null;
    frames: Record<string, Grout13FrameRect | Grout13FrameMetadata>;
}

export interface Grout13RuntimeContract {
    formatVersion: 1;
    encoderId: 'atlas-rle' | 'row-run-rle';
    runEncoding: 'atlas-rle' | 'row-run-rle';
    drawMode: 'pixel' | 'row';
    frameMode: 'object' | 'metadata' | 'raw';
    runtimeTarget: 'canvas' | 'rgba' | 'indexed';
    includeNames: boolean;
    rowBoundOpaque: boolean;
    optimizeLayout: false;
    layoutId: null;
}

export interface Grout13CompiledRuntimeOptions {
    functionName: string;
    terse: boolean;
    frameMode: 'object' | 'metadata' | 'raw';
    drawMode: 'pixel' | 'row';
    runtimeTarget: 'canvas' | 'rgba' | 'indexed';
    requireCanvas: boolean;
}

export interface Grout13CompiledBundleOptions extends Grout13CompiledRuntimeOptions {
    payloadName: string;
}

export interface Grout13CompiledAtlas {
    payload: Grout13Payload;
    atlas: RgbaAtlas;
    frames: RgbaAtlasFrame[];
    frameOrder: string[];
    frameIndexMap: Record<string, number>;
    palette: number[];
    indexed: Uint8Array;
    encoded: string;
    runtimeContract: Grout13RuntimeContract;
    runtimeOptions: Grout13CompiledRuntimeOptions;
    bundleOptions: Grout13CompiledBundleOptions;
    runtimeSource: string;
    bundleSource: string;
    bytes: { payload: number; runtime: number; bundle: number };
}

export interface Grout13RuntimeSourceOptions {
    functionName?: string;
    terse?: boolean;
    frameMode?: 'object' | 'metadata' | 'raw';
    drawMode?: 'pixel' | 'row';
    runtimeTarget?: 'canvas' | 'rgba' | 'indexed';
    requireCanvas?: boolean;
}

export interface Grout13BundleSourceOptions extends Grout13RuntimeSourceOptions {
    payloadName?: string;
    module?: boolean;
}

export interface Grout13DecodeOptions {
    canvasFactory?: (width: number, height: number) => HTMLCanvasElement | null;
}

export declare function decodeGrout13Atlas(payload: Grout13Payload, options?: Grout13DecodeOptions): Grout13DecodedAtlas;
export declare function createGrout13RuntimeSourceFromCompiled(compiled: Grout13CompiledAtlas, options?: Grout13RuntimeSourceOptions): string;
export declare function createGrout13BundleSourceFromCompiled(compiled: Grout13CompiledAtlas, options?: Grout13BundleSourceOptions): string;
export declare function escapeGrout13InlineScriptSource(source: string): string;
export declare function getGrout13PayloadBytes(payload: Grout13Payload): number;
export declare function compileGrout13Atlas(assets: Grout13AssetInput[], options?: Grout13CompileOptions): Grout13CompiledAtlas;
