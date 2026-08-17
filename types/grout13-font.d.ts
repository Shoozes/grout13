import type { RgbaAtlas } from './font-atlas';
import type { Grout13CompiledAtlas } from './grout13';

export interface Grout13FontGlyphRows {
    [character: string]: string[];
}

export interface Grout13FontGlyphMetrics {
    name: string;
    width: number;
    height: number;
    advance: number;
}

export interface Grout13FontMetrics {
    sourceScale: number;
    tracking: number;
    lineHeight: number;
    fallback: string;
    fallbackFrame: string;
}

export interface Grout13CompiledFont {
    name: string;
    atlas: RgbaAtlas;
    compiled: Grout13CompiledAtlas;
    glyphs: Record<string, Grout13FontGlyphMetrics>;
    metrics: Grout13FontMetrics;
}

export interface Grout13FontCompileOptions {
    name?: string;
    glyphs: Grout13FontGlyphRows;
    sourceScale?: number;
    tracking?: number;
    lineHeight?: number;
    fallback?: string;
    compileOptions?: Record<string, unknown>;
}

export interface Grout13FontMeasureResult {
    width: number;
    height: number;
    characters: number;
}

export declare function glyphFrameName(character: string): string;
export declare function glyphRowsToAsset(character: string, rows: string[], sourceScale: number): {
    name: string;
    spec: { w: number; h: number; steps: Array<Record<string, unknown>> };
};
export declare function compileFontAtlas(options: Grout13FontCompileOptions): Grout13CompiledFont;
export declare function measureFontText(font: Grout13CompiledFont, text: unknown, options?: { scale?: number }): Grout13FontMeasureResult;
