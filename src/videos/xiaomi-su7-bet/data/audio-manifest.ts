/**
 * Legacy per-line audio manifest — kept empty for this video.
 *
 * xiaomi-su7-bet uses the modern continuous-audio mode:
 * one MP3 per part with MiniMax word-level alignment. See alignment-manifest.ts.
 *
 * This file exists because scripts/validate-video.ts and shared/lib/part-audio.ts
 * expect both manifests to be importable — the selector picks continuous when
 * alignment is present, falls back to this when not.
 */

export type AudioEntry = { file: string; duration: number };

export const audioManifest: Record<string, Record<string, Record<string, AudioEntry>>> = {
  cn: {},
  en: {},
};
