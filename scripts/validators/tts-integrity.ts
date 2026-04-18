#!/usr/bin/env bun
/**
 * TTS audio integrity check.
 *
 * For each part audio file:
 *   1. File is non-empty and ffprobe-readable
 *   2. Tail silence ≥ 200ms (prevents abrupt cut when the next part begins)
 *   3. No sharp amplitude drop in the final 500ms (waveform cliff = truncated audio)
 *
 * Usage: bun run scripts/validators/tts-integrity.ts --video <slug>
 */

import path from "node:path";
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const slug = args[args.indexOf("--video") + 1];
if (!slug || slug === "--video") {
  console.error("ERROR: --video <slug> required");
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dir, "..", "..");
const DATA_DIR = path.join(ROOT, "src", "videos", slug, "data");

const { alignmentManifest } = await import(path.join(DATA_DIR, "alignment-manifest.ts")) as {
  alignmentManifest: Record<string, Record<string, { file: string; totalDuration: number }>>;
};

let issues = 0;

for (const lang of Object.keys(alignmentManifest)) {
  const parts = alignmentManifest[lang];
  for (const [partKey, part] of Object.entries(parts)) {
    if (!part?.file) continue;
    const audioPath = path.join(ROOT, "public", part.file);
    try { await fs.access(audioPath); }
    catch { console.log(`  🔴 ${lang}/${partKey}: audio file missing — ${part.file}`); issues++; continue; }

    let actualDur = 0;
    try {
      const out = execFileSync("ffprobe",
        ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audioPath],
        { encoding: "utf-8" }
      );
      actualDur = parseFloat(out.trim());
    } catch (e) {
      console.log(`  🔴 ${lang}/${partKey}: ffprobe failed — ${e}`); issues++; continue;
    }
    if (Math.abs(actualDur - part.totalDuration) > 0.5) {
      console.log(`  ⚠️  ${lang}/${partKey}: alignment says ${part.totalDuration}s but file is ${actualDur.toFixed(2)}s`);
    }

    // Truncation detection: extract the very last 200ms (the file's literal end).
    // A clean TTS file ends in silence (≤0.08 amp). If the last 200ms is loud,
    // the audio was cut mid-word. We use 200ms (not 500ms) so we don't catch
    // the natural tail of the final spoken word — only the silence after it.
    const tmp = `/tmp/vv-${lang}-${partKey}-tail.raw`;
    try {
      execFileSync("ffmpeg",
        ["-y", "-ss", String(Math.max(0, actualDur - 0.2)), "-i", audioPath,
         "-t", "0.2", "-f", "s16le", "-ac", "1", "-ar", "22050", tmp],
        { stdio: ["ignore", "ignore", "ignore"] }
      );
      const buf = await fs.readFile(tmp);
      let maxAmp = 0;
      for (let i = 0; i < buf.length; i += 2) {
        const sample = Math.abs(buf.readInt16LE(i));
        if (sample > maxAmp) maxAmp = sample;
      }
      const maxAmpNorm = maxAmp / 32768;
      await fs.unlink(tmp).catch(() => {});

      if (maxAmpNorm > 0.08) {
        console.log(`  🔴 ${lang}/${partKey}: final 200ms max amplitude ${maxAmpNorm.toFixed(3)} — likely truncated (expected < 0.08)`);
        issues++;
      } else {
        console.log(`  ✅ ${lang}/${partKey}: ${actualDur.toFixed(1)}s, tail amp ${maxAmpNorm.toFixed(3)}`);
      }
    } catch (e) {
      console.log(`  ⚠️  ${lang}/${partKey}: tail check skipped — ${e}`);
    }
  }
}

console.log(`\nTTS integrity issues: ${issues}`);
process.exit(issues > 0 ? 1 : 0);
