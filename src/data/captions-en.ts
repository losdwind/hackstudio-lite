import type { Caption } from "@remotion/captions";

const FPS = 30;
const f2ms = (frame: number) => (frame / FPS) * 1000;

// Helper: split English text into word-level captions
const textToCaptions = (
  text: string,
  startMs: number,
  endMs: number,
): Caption[] => {
  const words = text.split(/\s+/);
  const duration = endMs - startMs;
  const wordDuration = duration / words.length;

  return words.map((word, i) => ({
    text: (i === 0 ? "" : " ") + word,
    startMs: startMs + i * wordDuration,
    endMs: startMs + (i + 1) * wordDuration,
    timestampMs: startMs + i * wordDuration,
    confidence: 1,
  }));
};

// Part offsets (same as CN)
const PART1_OFFSET = 0;
const PART2_OFFSET = 1485;
const PART3_OFFSET = 2970;
const PART4_OFFSET = 4755;

const part1Narration = [
  "In 2010, Xiaomi was founded. The model was simple: make phones at extreme value, keep profits in software and services.",
  "A decade later, Xiaomi had 500 million connected devices and 37 billion dollars in annual revenue. But to global auto investors, it was still just a cheap phone company.",
  "Meanwhile, something extraordinary was happening in China's electric vehicle market.",
  "When a car becomes a smart device on four wheels, does the line between phone companies and car companies still matter?",
];

const part2Narration = [
  "In early 2021, Lei Jun discovered something that kept him up at night: Xiaomi's top engineers were sending resumes to car companies.",
  "This wasn't job-hopping. It was industry gravity.",
  "Lei Jun made a decision: spend 75 days interviewing 200 auto industry experts.",
  "Then he walked into the boardroom: This requires 65 billion yuan and 10 years. Not a penny less, not a year less.",
];

const part3Narration = [
  "They assembled a 4,000-person car team — 3 to 4 times the industry average for similar projects.",
  "The SU7's design was deliberately rounded — data showed female users preferred it.",
  "The pricing debate lasted 6 months. 199,000 or 215,900 yuan?",
  "27 minutes after the launch event ended, 50,000 orders were confirmed.",
];

const part4Narration = [
  "Xiaomi's success proved one thing: in the smart era, the ticket to the auto industry is no longer a century of manufacturing experience.",
  "Today, over 50 Chinese tech and consumer electronics companies are entering the auto supply chain.",
  "The real question isn't Can Xiaomi survive — it's: when the moat changes, who owns pricing power?",
];

export const captionsEN: Caption[] = [
  // Part 1
  ...textToCaptions(part1Narration[0], f2ms(PART1_OFFSET + 130), f2ms(PART1_OFFSET + 280)),
  ...textToCaptions(part1Narration[1], f2ms(PART1_OFFSET + 290), f2ms(PART1_OFFSET + 410)),
  ...textToCaptions(part1Narration[2], f2ms(PART1_OFFSET + 730), f2ms(PART1_OFFSET + 920)),
  ...textToCaptions(part1Narration[3], f2ms(PART1_OFFSET + 1330), f2ms(PART1_OFFSET + 1490)),

  // Part 2
  ...textToCaptions(part2Narration[0], f2ms(PART2_OFFSET + 130), f2ms(PART2_OFFSET + 280)),
  ...textToCaptions(part2Narration[1], f2ms(PART2_OFFSET + 290), f2ms(PART2_OFFSET + 400)),
  ...textToCaptions(part2Narration[2], f2ms(PART2_OFFSET + 730), f2ms(PART2_OFFSET + 920)),
  ...textToCaptions(part2Narration[3], f2ms(PART2_OFFSET + 1210), f2ms(PART2_OFFSET + 1480)),

  // Part 3
  ...textToCaptions(part3Narration[0], f2ms(PART3_OFFSET + 130), f2ms(PART3_OFFSET + 330)),
  ...textToCaptions(part3Narration[1], f2ms(PART3_OFFSET + 250), f2ms(PART3_OFFSET + 350)),
  ...textToCaptions(part3Narration[2], f2ms(PART3_OFFSET + 730), f2ms(PART3_OFFSET + 880)),
  ...textToCaptions(part3Narration[3], f2ms(PART3_OFFSET + 1080), f2ms(PART3_OFFSET + 1250)),

  // Part 4
  ...textToCaptions(part4Narration[0], f2ms(PART4_OFFSET + 130), f2ms(PART4_OFFSET + 390)),
  ...textToCaptions(part4Narration[1], f2ms(PART4_OFFSET + 680), f2ms(PART4_OFFSET + 900)),
  ...textToCaptions(part4Narration[2], f2ms(PART4_OFFSET + 1370), f2ms(PART4_OFFSET + 1560)),
];
