/**
 * Shared type definitions for TTS alignment data.
 * Used by SubtitleOverlay and PartRenderer across all videos.
 */

export interface WordTiming {
  text: string;
  /** Seconds from start of the part audio file */
  start: number;
  /** Seconds from start of the part audio file */
  end: number;
}

export interface LineTiming {
  /** When this sentence starts in the part audio (seconds) */
  startTime: number;
  /** When this sentence ends in the part audio (seconds) */
  endTime: number;
  /** Word-level timestamps for caption highlighting */
  words: WordTiming[];
}

export interface PartAlignment {
  /** Path relative to public/, e.g. "xiaomi-su7/audio/cn/part1-full.mp3" */
  file: string;
  /** Total duration of the part audio in seconds */
  totalDuration: number;
  /** Per-line timing data, keyed as line1, line2, ... */
  lines: Record<string, LineTiming>;
}
