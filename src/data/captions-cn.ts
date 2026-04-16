import type { Caption } from "@remotion/captions";

// Generate captions from narration text with timing.
// Timing is based on sequence positions in each Part (30fps).
// Each narration line gets evenly distributed within its sequence duration.

const FPS = 30;

// Helper: convert frame to ms
const f2ms = (frame: number) => (frame / FPS) * 1000;

// Helper: split text into word-level captions within a time range
const textToCaptions = (
  text: string,
  startMs: number,
  endMs: number,
): Caption[] => {
  // For Chinese, split by character groups (roughly 2-4 chars per "word")
  const chunks = text.match(/.{1,4}/g) || [text];
  const duration = endMs - startMs;
  const chunkDuration = duration / chunks.length;

  return chunks.map((chunk, i) => ({
    text: chunk,
    startMs: startMs + i * chunkDuration,
    endMs: startMs + (i + 1) * chunkDuration,
    timestampMs: startMs + i * chunkDuration,
    confidence: 1,
  }));
};

// ─── Part 1 ─────────────────────────────────────
// Title: 0-120f, Narration1: 120-420f, EVChart: 420-720f,
// Narration2: 720-960f, Timeline: 960-1320f, Narration3: 1320-1500f

const part1Narration = [
  "2010年，小米成立。它的模式很简单：把手机做到极致性价比，把利润留给软件和服务。",
  "十年后，小米有了5亿台联网设备、370亿美元年营收。但在全球汽车投资人眼里，它仍然只是一家便宜手机公司。",
  "与此同时，中国的电动车市场正在发生一件不可思议的事。",
  "当汽车变成一台有四个轮子的智能设备，手机公司和汽车公司的边界，还有意义吗？",
];

// ─── Part 2 ─────────────────────────────────────
// Title: 0-120f, Narration1: 120-420f, TalentFlow: 420-720f,
// Narration2: 720-960f, Investment: 960-1200f, Narration3: 1200-1500f

const part2Narration = [
  "2021年初，雷军发现了一个让他彻夜难眠的数据：小米的顶级工程师，开始向汽车公司投简历。",
  "这不是跳槽，这是行业的引力。",
  "雷军做了一个决定：用75天时间，密集访谈200位汽车行业专家。",
  "然后他走进董事会：这需要650亿人民币和10年时间。少一分钱，少一年，我都不做。",
];

// ─── Part 3 ─────────────────────────────────────
const part3Narration = [
  "他们组建了4000人的造车团队——是同类项目行业平均的3到4倍。",
  "SU7的外形被刻意做圆润——因为数据显示女性用户更喜欢。",
  "定价那天，内部吵了6个月。19.9万还是21.59万？",
  "发布会结束27分钟后，5万张订单确认。",
];

// ─── Part 4 ─────────────────────────────────────
const part4Narration = [
  "小米的成功，证明了一件事：在智能化时代，汽车行业的入场券，不再是百年的造车经验。",
  "现在，有超过50家中国科技和消费电子公司，正在以不同形式进入汽车产业链。",
  "真正的问题不是小米能不能活下去，而是：当护城河变了，谁拥有定价权？",
];

// Build full caption timeline.
// Part offsets (cumulative frames in MasterComposition with transitions):
// Part1 starts at 0, Part2 at ~1500f, Part3 at ~3000f, Part4 at ~4800f
// (approximate — transitions subtract 15f each)

const PART1_OFFSET = 0;
const PART2_OFFSET = 1485; // 1500 - 15 transition
const PART3_OFFSET = 2970; // 1485 + 1500 - 15
const PART4_OFFSET = 4755; // 2970 + 1800 - 15

export const captionsCN: Caption[] = [
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
