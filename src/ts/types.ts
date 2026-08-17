import type { Category } from "./library"

export type Mode = 'eras' | 'composers';

export interface DeezerTrack { // representation of the key properties of a deezer track object
    id: number,
    title: string,
    link: string,
    preview: string,
    album: {
        cover_big: string
    }
}

export interface SessionSettings {
    probabilityDivisor: number,
    probabilityCeil: number,
    probabilityFloor: number
}

export interface SessionMatchup {
    leftCategory: null | Category,
    rightCategory: null | Category,

    leftTrack: null | DeezerTrack,
    rightTrack: null | DeezerTrack
}

export interface TrackData {
    leftTrack: DeezerTrack,
    rightTrack: DeezerTrack,

    paletteLeft: null | ColorThiefPalette,
    paletteRight: null | ColorThiefPalette
}

export type ColorThiefPalette = [ // representation of a colorthief palette output (as used by ui.ts)
    [number, number, number],
    [number, number, number],
];

export interface PaletteAndPreview {
    preview: string,
    palette: ColorThiefPalette
}