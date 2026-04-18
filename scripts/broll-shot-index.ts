#!/usr/bin/env bun
/**
 * Parse all *.analysis.md files in public/<slug>/videos/ into a shot-index JSON.
 *
 * Converts the 3s-granularity frame-by-frame tables into per-shot rows the
 * retrieval scorer can query semantically, instead of the current per-file
 * 40s-slot allocation in broll-manifest.ts.
 *
 * Output: research/<slug>/shot-index.json
 *
 * Usage:
 *   bun run scripts/broll-shot-index.ts --video xiaomi-su7
 */

import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const getFlag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const slug = getFlag("--video");
if (!slug) {
  console.error("Missing --video <slug>");
  process.exit(1);
}

const videoDir = path.join("public", slug, "videos");
const outDir = path.join("research", slug);
const outFile = path.join(outDir, "shot-index.json");

type Shot = {
  file: string;
  tSec: number;
  startSec: number;
  endSec: number;
  text: string;
  tokens: string[];
  entities: string[];
  isTextFrame: boolean;
};

type FileIndex = {
  file: string;
  displayName: string;
  durationSec: number | null;
  intervalSec: number | null;
  summary: string;
  shots: Shot[];
};

const STOPWORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","of","in","on","at","to","for","with",
  "by","from","as","and","or","but","if","then","so","that","this","these","those","it","its","their",
  "there","here","which","what","who","whom","whose","when","where","why","how","not","no","yes","do",
  "does","did","done","have","has","had","having","can","could","should","would","may","might","will",
  "shall","about","into","onto","upon","over","under","up","down","out","off","than","very","also",
  "appears","appear","showing","shows","shown","seems","seem","looks","look","image","video","frame",
  "scene","depicts","depict","features","feature","displayed","display","visible","situated","located",
  "positioned","centered","prominent","prominently","background","foreground","text","reads","small",
  "large","top","bottom","left","right","side","corner","center","middle","close","view",
  "against","partially","fully","primarily","mostly","partly","some","any","each","other",
  "another","more","most","less","least","many","much","few","several","all","both","either","neither",
]);

const ENTITIES: Array<{ key: string; variants: string[] }> = [
  { key: "leijun", variants: ["lei jun", "leijun", "chairman", "ceo"] },
  { key: "xiaomi", variants: ["xiaomi", "mi logo", "mi brand"] },
  { key: "su7", variants: ["su7", "su 7", "sedan"] },
  { key: "apple", variants: ["apple"] },
  { key: "tesla", variants: ["tesla", "model 3", "model s"] },
  { key: "byd", variants: ["byd"] },
  { key: "porsche", variants: ["porsche", "taycan"] },
  { key: "factory", variants: ["factory", "assembly", "production line", "robotic arm", "manufacturing"] },
  { key: "stage", variants: ["stage", "keynote", "presentation", "podium", "speaker", "audience"] },
  { key: "showroom", variants: ["showroom", "dealership", "display floor"] },
  { key: "driving", variants: ["driving", "highway", "road", "street", "traffic", "racetrack"] },
  { key: "interior", variants: ["dashboard", "steering wheel", "cockpit", "seat"] },
  { key: "phone", variants: ["smartphone", "phone", "mobile"] },
  { key: "ecosystem", variants: ["ecosystem", "aiot", "connected device", "smart home"] },
  { key: "chart", variants: ["chart", "graph", "data visualization"] },
  { key: "city", variants: ["city", "skyline", "urban", "skyscraper"] },
];

const tokenize = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return [...new Set(words)];
};

const extractEntities = (text: string): string[] => {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const { key, variants } of ENTITIES) {
    if (variants.some((v) => lower.includes(v))) hits.push(key);
  }
  return hits;
};

const isTextFrame = (text: string): boolean => {
  const lower = text.toLowerCase();
  const textSignals = [
    /text (that )?reads/,
    /\btitle\b.*text/,
    /solid (black|white) background.*(text|font)/,
    /black background with.*text/,
    /white background with.*text/,
    /^the (image|video frame) (shows|features) .*(text|logo|font|title)/,
  ];
  const hasTextSignal = textSignals.some((re) => re.test(lower));
  const hasConcreteSubject = /\b(car|vehicle|person|man|woman|dog|robot|phone|factory|road|stage|building|crowd|audience|tire|wheel|engine|battery|mountain|water|sky|face|hand)\b/.test(lower);
  return hasTextSignal && !hasConcreteSubject;
};

const parseTime = (s: string): number => {
  const parts = s.trim().split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
};

const parseDuration = (header: string): number | null => {
  const m = header.match(/\*\*Duration:\*\*\s*([\d:]+)/);
  return m ? parseTime(m[1]) : null;
};

const parseInterval = (header: string): number | null => {
  const m = header.match(/\*\*Interval:\*\*\s*([\d.]+)s/);
  return m ? parseFloat(m[1]) : null;
};

const parseSummary = (body: string): string => {
  const m = body.match(/## Summary\s*\n([\s\S]*?)(\n##|$)/);
  return m ? m[1].trim() : "";
};

const parseShots = (body: string): Array<{ tSec: number; text: string }> => {
  const timelineStart = body.indexOf("## Frame-by-Frame Timeline");
  if (timelineStart < 0) return [];
  const timeline = body.slice(timelineStart);
  const rows: Array<{ tSec: number; text: string }> = [];
  const rowRe = /^\|\s*(\d+:\d+(?::\d+)?)\s*\|\s*([\s\S]*?)\s*\|\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(timeline)) !== null) {
    const tSec = parseTime(match[1]);
    const text = match[2].replace(/\s+/g, " ").trim();
    if (!Number.isNaN(tSec) && text.length > 0) rows.push({ tSec, text });
  }
  return rows;
};

const main = async () => {
  const files = (await fs.readdir(videoDir)).filter((f) => f.endsWith(".analysis.md"));
  console.log(`Found ${files.length} analysis files in ${videoDir}`);

  const index: FileIndex[] = [];

  for (const fname of files) {
    const fullPath = path.join(videoDir, fname);
    const body = await fs.readFile(fullPath, "utf8");
    const displayName = fname.replace(".analysis.md", "");
    const mp4Path = `${slug}/videos/${displayName}.mp4`;

    const headerLine = body.split("\n").find((l) => l.includes("**Duration:**")) ?? "";
    const durationSec = parseDuration(headerLine);
    const intervalSec = parseInterval(headerLine);
    const summary = parseSummary(body);
    const rawShots = parseShots(body);

    const shots: Shot[] = rawShots.map((row, i) => {
      const prev = rawShots[i - 1]?.tSec;
      const next = rawShots[i + 1]?.tSec;
      const half = intervalSec ? intervalSec / 2 : 1.5;
      const startSec = prev !== undefined ? (prev + row.tSec) / 2 : Math.max(0, row.tSec - half);
      const endSec = next !== undefined ? (row.tSec + next) / 2 : row.tSec + half;

      return {
        file: mp4Path,
        tSec: row.tSec,
        startSec: Math.round(startSec * 10) / 10,
        endSec: Math.round(endSec * 10) / 10,
        text: row.text,
        tokens: tokenize(row.text),
        entities: extractEntities(row.text),
        isTextFrame: isTextFrame(row.text),
      };
    });

    const textFrameCount = shots.filter((s) => s.isTextFrame).length;
    console.log(
      `  ${displayName.padEnd(42)}  ${shots.length.toString().padStart(3)} shots  ` +
        `(${textFrameCount} text frames, ${durationSec}s)`,
    );

    index.push({
      file: mp4Path,
      displayName,
      durationSec,
      intervalSec,
      summary,
      shots,
    });
  }

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(index, null, 2));

  const totalShots = index.reduce((sum, f) => sum + f.shots.length, 0);
  const totalTextFrames = index.reduce((sum, f) => sum + f.shots.filter((s) => s.isTextFrame).length, 0);
  console.log(
    `\nWrote ${outFile}\n  ${index.length} files, ${totalShots} shots total, ${totalTextFrames} flagged as text-frames`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
