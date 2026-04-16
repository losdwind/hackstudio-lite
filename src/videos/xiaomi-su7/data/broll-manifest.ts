// B-roll video manifest — 5-PART STRUCTURE
//
// ZERO OVERLAP RULE: No two sequences in the entire video may use
// overlapping time ranges from the same source file.
// Each slot is 40s wide (max narration line length after TTS).
// Adjacent sequences within a part never use the same source file.
//
// 8 source files, 46 sequences. china-ev-streets skips BBC splash at 0-5s.

export const brollManifest = {
  part1: {
    // "The Convergence" — 7 narration lines (narration1 has showTitle)
    narration1: { file: "xiaomi-su7/videos/official-xiaomi-su7-reveal.mp4", startFrom: 6 },      // reveal [6-45]
    narration2: { file: "xiaomi-su7/videos/official-china-ev-streets.mp4", startFrom: 6 },        // china-ev [6-45]
    narration3: { file: "xiaomi-su7/videos/official-ev-market.mp4", startFrom: 0 },               // ev-market [0-39]
    narration4: { file: "xiaomi-su7/videos/official-china-ev-streets.mp4", startFrom: 50 },       // china-ev [50-89]
    narration5: { file: "xiaomi-su7/videos/official-ev-market.mp4", startFrom: 40 },              // ev-market [40-79]
    narration6: { file: "xiaomi-su7/videos/official-china-ev-streets.mp4", startFrom: 90 },       // china-ev [90-129]
    narration7: { file: "xiaomi-su7/videos/official-leijun-stage.mp4", startFrom: 0 },            // leijun-stage [0-39]
  },
  part2: {
    // "The Death March" — 10 narration lines (narration1 has showTitle)
    narration1:  { file: "xiaomi-su7/videos/official-xiaomi-su7-reveal.mp4", startFrom: 48 },     // reveal [48-87]
    narration2:  { file: "xiaomi-su7/videos/official-leijun-stage.mp4", startFrom: 40 },          // leijun-stage [40-79]
    narration3:  { file: "xiaomi-su7/videos/official-su7-factory.mp4", startFrom: 0 },            // factory [0-39]
    narration4:  { file: "xiaomi-su7/videos/official-leijun-stage.mp4", startFrom: 80 },          // leijun-stage [80-119]
    narration5:  { file: "xiaomi-su7/videos/official-ev-market.mp4", startFrom: 120 },            // ev-market [120-159]
    narration6:  { file: "xiaomi-su7/videos/official-leijun-stage.mp4", startFrom: 120 },         // leijun-stage [120-159]
    narration7:  { file: "xiaomi-su7/videos/official-ev-market.mp4", startFrom: 160 },            // ev-market [160-199]
    narration8:  { file: "xiaomi-su7/videos/official-su7-factory.mp4", startFrom: 42 },           // factory [42-81]
    narration9:  { file: "xiaomi-su7/videos/official-leijun-stage.mp4", startFrom: 160 },         // leijun-stage [160-199]
    narration10: { file: "xiaomi-su7/videos/official-su7-showroom.mp4", startFrom: 0 },           // showroom [0-39]
  },
  part3: {
    // "Why Big Companies Die" — 8 narration lines (narration1 has showTitle)
    narration1: { file: "xiaomi-su7/videos/official-leijun-stage.mp4", startFrom: 200 },          // leijun-stage [200-239]
    narration2: { file: "xiaomi-su7/videos/official-ev-market.mp4", startFrom: 200 },             // ev-market [200-239]
    narration3: { file: "xiaomi-su7/videos/official-leijun-stage.mp4", startFrom: 240 },          // leijun-stage [240-279]
    narration4: { file: "xiaomi-su7/videos/official-su7-factory.mp4", startFrom: 84 },            // factory [84-123]
    narration5: { file: "xiaomi-su7/videos/official-ev-market.mp4", startFrom: 240 },             // ev-market [240-279]
    narration6: { file: "xiaomi-su7/videos/official-su7-factory.mp4", startFrom: 126 },           // factory [126-165]
    narration7: { file: "xiaomi-su7/videos/official-su7-showroom.mp4", startFrom: 40 },           // showroom [40-79]
    narration8: { file: "xiaomi-su7/videos/official-su7-driving.mp4", startFrom: 0 },             // driving [0-39]
  },
  part4: {
    // "The Battle" — 8 narration lines (narration1 has showTitle)
    narration1: { file: "xiaomi-su7/videos/official-su7-showroom.mp4", startFrom: 80 },           // showroom [80-119]
    narration2: { file: "xiaomi-su7/videos/official-su7-driving.mp4", startFrom: 40 },            // driving [40-79]
    narration3: { file: "xiaomi-su7/videos/official-su7-showroom.mp4", startFrom: 120 },          // showroom [120-159]
    narration4: { file: "xiaomi-su7/videos/official-su7-driving.mp4", startFrom: 80 },            // driving [80-119]
    narration5: { file: "xiaomi-su7/videos/official-leijun-stage.mp4", startFrom: 280 },          // leijun-stage [280-319]
    narration6: { file: "xiaomi-su7/videos/official-su7-showroom.mp4", startFrom: 160 },          // showroom [160-199]
    narration7: { file: "xiaomi-su7/videos/official-su7-driving.mp4", startFrom: 120 },           // driving [120-159]
    narration8: { file: "xiaomi-su7/videos/official-ev-market.mp4", startFrom: 280 },             // ev-market [280-319]
  },
  part5: {
    // "The Real Game" — 7 narration lines + ending (narration1 has showTitle)
    narration1: { file: "xiaomi-su7/videos/official-xiaomi-ecosystem.mp4", startFrom: 0 },        // ecosystem [0-39]
    narration2: { file: "xiaomi-su7/videos/official-leijun-speech.mp4", startFrom: 0 },           // speech [0-39]
    narration3: { file: "xiaomi-su7/videos/official-xiaomi-ecosystem.mp4", startFrom: 40 },       // ecosystem [40-79]
    narration4: { file: "xiaomi-su7/videos/official-leijun-speech.mp4", startFrom: 40 },          // speech [40-79]
    narration5: { file: "xiaomi-su7/videos/official-ev-market.mp4", startFrom: 320 },             // ev-market [320-359]
    narration6: { file: "xiaomi-su7/videos/official-su7-driving.mp4", startFrom: 160 },           // driving [160-199]
    narration7: { file: "xiaomi-su7/videos/official-leijun-speech.mp4", startFrom: 80 },          // speech [80-119]
    ending:     { file: "xiaomi-su7/videos/official-china-ev-streets.mp4", startFrom: 130 },      // china-ev [130-169]
  },
};
