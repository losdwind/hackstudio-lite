import type { Lang } from "../schemas/video-schema";

/**
 * A sequence is one narration line + its visual treatment.
 *
 * Each kind renders differently:
 *   - video:  moving B-roll behind narration (primary storytelling mode)
 *   - chart:  calm gradient background behind a chart/diagram component
 *   - title:  calm gradient with large title text (part opener)
 *   - quote:  calm gradient with centered quote + attribution
 *   - ending: final closing video with overlay component
 *
 * All non-ending kinds carry lineIdx so captions sync to the TTS line.
 */
export type SequenceEntry =
  | {
      kind: "video";
      lineIdx: number;
      brollKey: string;
      /** Dim the video 0..1. Default 0.25 (vivid). */
      videoOpacity?: number;
    }
  | {
      kind: "chart";
      lineIdx: number;
      component: React.ComponentType<{ lang: Lang }>;
    }
  | {
      kind: "title";
      lineIdx: number;
      /** If true (default), use the part's title/subtitle. If false, provide inline text. */
      usePartTitle?: boolean;
      title?: string;
      subtitle?: string;
    }
  | {
      kind: "quote";
      lineIdx: number;
      text: string;
      attribution?: string;
    }
  | {
      kind: "ending";
      brollKey: string;
      component: React.ComponentType<{ lang: Lang }>;
      videoOpacity?: number;
    };

export function isNarrationKind(
  seq: SequenceEntry
): seq is Exclude<SequenceEntry, { kind: "ending" }> {
  return seq.kind !== "ending";
}
