// TTS voiceover manifest — every sequence has narration.
// CN voice: zh-CN-YunyangNeural | EN voice: en-US-ChristopherNeural
//
// Structure per part: line1, line2, ... line6 (or line5 for part4)
// Lines map to sequences in order: narr → narr → anim → narr → anim → narr

export const audioManifest = {
  cn: {
    part1: {
      line1: { file: "audio/cn/part1-line1.mp3", duration: 8.664 },
      line2: { file: "audio/cn/part1-line2.mp3", duration: 10.8 },
      line3: { file: "audio/cn/part1-line3.mp3", duration: 12.36 },
      line4: { file: "audio/cn/part1-line4.mp3", duration: 5.208 },
      line5: { file: "audio/cn/part1-line5.mp3", duration: 8.856 },
      line6: { file: "audio/cn/part1-line6.mp3", duration: 7.536 },
    },
    part2: {
      line1: { file: "audio/cn/part2-line1.mp3", duration: 8.688 },
      line2: { file: "audio/cn/part2-line2.mp3", duration: 10.968 },
      line3: { file: "audio/cn/part2-line3.mp3", duration: 10.224 },
      line4: { file: "audio/cn/part2-line4.mp3", duration: 6.0 },
      line5: { file: "audio/cn/part2-line5.mp3", duration: 8.712 },
      line6: { file: "audio/cn/part2-line6.mp3", duration: 8.136 },
    },
    part3: {
      line1: { file: "audio/cn/part3-line1.mp3", duration: 6.024 },
      line2: { file: "audio/cn/part3-line2.mp3", duration: 5.784 },
      line3: { file: "audio/cn/part3-line3.mp3", duration: 7.872 },
      line4: { file: "audio/cn/part3-line4.mp3", duration: 6.216 },
      line5: { file: "audio/cn/part3-line5.mp3", duration: 7.944 },
      line6: { file: "audio/cn/part3-line6.mp3", duration: 6.768 },
    },
    part4: {
      line1: { file: "audio/cn/part4-line1.mp3", duration: 8.064 },
      line2: { file: "audio/cn/part4-line2.mp3", duration: 10.8 },
      line3: { file: "audio/cn/part4-line3.mp3", duration: 7.536 },
      line4: { file: "audio/cn/part4-line4.mp3", duration: 6.072 },
      line5: { file: "audio/cn/part4-line5.mp3", duration: 7.032 },
    },
  },
  en: {
    part1: {
      line1: { file: "audio/en/part1-line1.mp3", duration: 10.632 },
      line2: { file: "audio/en/part1-line2.mp3", duration: 13.104 },
      line3: { file: "audio/en/part1-line3.mp3", duration: 13.872 },
      line4: { file: "audio/en/part1-line4.mp3", duration: 5.784 },
      line5: { file: "audio/en/part1-line5.mp3", duration: 10.08 },
      line6: { file: "audio/en/part1-line6.mp3", duration: 7.728 },
    },
    part2: {
      line1: { file: "audio/en/part2-line1.mp3", duration: 9.432 },
      line2: { file: "audio/en/part2-line2.mp3", duration: 12.84 },
      line3: { file: "audio/en/part2-line3.mp3", duration: 10.824 },
      line4: { file: "audio/en/part2-line4.mp3", duration: 7.08 },
      line5: { file: "audio/en/part2-line5.mp3", duration: 12.336 },
      line6: { file: "audio/en/part2-line6.mp3", duration: 9.216 },
    },
    part3: {
      line1: { file: "audio/en/part3-line1.mp3", duration: 7.608 },
      line2: { file: "audio/en/part3-line2.mp3", duration: 6.36 },
      line3: { file: "audio/en/part3-line3.mp3", duration: 8.904 },
      line4: { file: "audio/en/part3-line4.mp3", duration: 5.856 },
      line5: { file: "audio/en/part3-line5.mp3", duration: 12.144 },
      line6: { file: "audio/en/part3-line6.mp3", duration: 10.68 },
    },
    part4: {
      line1: { file: "audio/en/part4-line1.mp3", duration: 9.36 },
      line2: { file: "audio/en/part4-line2.mp3", duration: 7.224 },
      line3: { file: "audio/en/part4-line3.mp3", duration: 8.664 },
      line4: { file: "audio/en/part4-line4.mp3", duration: 8.496 },
      line5: { file: "audio/en/part4-line5.mp3", duration: 8.664 },
    },
  },
} as const;
