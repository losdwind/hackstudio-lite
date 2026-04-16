// B-roll video manifest — ZERO REPETITION + NO TEXT FRAMES as background.
// 9 clips, ~3500s total. Each second appears once. No title cards, infographics, or text overlays.
//
// Clip inventory:
//   official-xiaomi-su7-reveal.mp4  (89s)  — cinematic scenic driving, product beauty
//   official-leijun-speech.mp4      (300s) — engineering macro, orchestra, SU7 silhouettes at end
//   official-su7-factory.mp4        (169s) — factory, robots, production line, quality inspection
//   official-xiaomi-ecosystem.mp4   (300s) — HyperOS launch, consumer product demos
//   official-ev-market.mp4          (782s) — CNBC: Lei Jun, showrooms, analysts, city aerials
//   official-su7-driving.mp4        (437s) — SU7 Ultra Nurburgring POV lap
//   official-leijun-stage.mp4       (454s) — CNET: Lei Jun SU7 launch keynote on stage
//   official-china-ev-streets.mp4   (385s) — BBC: Chinese EV streets, charging, city life
//   official-su7-showroom.mp4       (597s) — Beijing Auto Show 2024, crowds, SU7 display

export const brollManifest = {
  part1: {
    // "Why would a phone company make cars?"
    title: { file: "videos/official-xiaomi-su7-reveal.mp4", startFrom: 4 },         // [4-12] Dark SU7 silhouette near water, shimmering reflections (skip title card at 0-4)
    narration1: { file: "videos/official-ev-market.mp4", startFrom: 0 },             // [0-12] CNBC: Xiaomi retail store, illuminated "mi" logo, product shelves
    narration2: { file: "videos/official-ev-market.mp4", startFrom: 354 },           // [354-366] CNBC: Xiaomi store interior — TVs, phones, laptops on tables (clean visual, no text overlay)
    evChart: { file: "videos/official-china-ev-streets.mp4", startFrom: 6 },         // [6-18] BBC: grey EV on road, person on scooter, highway traffic
    narration3: { file: "videos/official-china-ev-streets.mp4", startFrom: 48 },     // [48-60] BBC: white SUV driving, aerial city shot
    timeline: { file: "videos/official-ev-market.mp4", startFrom: 78 },              // [78-108] CNBC: Xiaomi retail store interior + SU7s at factory lot
    narration4: { file: "videos/official-leijun-speech.mp4", startFrom: 264 },       // [264-280] SU7 dark silhouette with glowing roofline curve + rear red taillight (no text)
  },
  part2: {
    // "The $10B bet"
    title: { file: "videos/official-leijun-stage.mp4", startFrom: 6 },              // [6-18] CNET: Lei Jun in grey suit on stage presenting (skip intro frame)
    narration1: { file: "videos/official-leijun-stage.mp4", startFrom: 36 },         // [36-48] CNET: Lei Jun gesturing on stage, audience visible
    narration2: { file: "videos/official-su7-factory.mp4", startFrom: 4 },           // [4-16] Aerial view of massive Xiaomi factory complex
    talentFlow: { file: "videos/official-leijun-stage.mp4", startFrom: 72 },         // [72-90] CNET: Lei Jun walking stage, explaining SU7 features
    narration3: { file: "videos/official-ev-market.mp4", startFrom: 174 },           // [174-186] CNBC: Tu Le (auto analyst) speaking in office + gesturing
    investment: { file: "videos/official-su7-factory.mp4", startFrom: 24 },          // [24-48] Die-casting cluster, 9100t press, robotic arms on chassis
    narration4: { file: "videos/official-leijun-stage.mp4", startFrom: 150 },        // [150-165] CNET: Lei Jun dramatic moment, close-up on stage
  },
  part3: {
    // "How they fought the battle"
    title: { file: "videos/official-su7-driving.mp4", startFrom: 6 },                // [6-20] Nurburgring POV, speed building up through turns
    narration1: { file: "videos/official-su7-showroom.mp4", startFrom: 12 },         // [12-24] Beijing Auto Show: venue building exterior, people walking in
    narration2: { file: "videos/official-xiaomi-su7-reveal.mp4", startFrom: 16 },    // [16-28] Interior: white leather seats, blue ambient door lighting, steering wheel
    spec: { file: "videos/official-su7-driving.mp4", startFrom: 36 },                // [36-54] High-speed track footage, 200+ km/h corners
    narration3: { file: "videos/official-su7-showroom.mp4", startFrom: 60 },         // [60-78] Auto show: people examining cars, crowded exhibition hall
    balance: { file: "videos/official-xiaomi-su7-reveal.mp4", startFrom: 36 },       // [36-48] SU7 through snowy forest road, motion shots
    counter: { file: "videos/official-su7-showroom.mp4", startFrom: 120 },           // [120-138] Auto show floor: crowd energy, SU7 on display stand
  },
  part4: {
    // "This isn't just Xiaomi's story"
    title: { file: "videos/official-ev-market.mp4", startFrom: 462 },                // [462-480] CNBC: Eunice Yoon speaking + purple car on track (pure video, no infographics)
    narration1: { file: "videos/official-ev-market.mp4", startFrom: 534 },           // [534-546] CNBC: three men examining turquoise SU7 in showroom (clean visual)
    ecosystem: { file: "videos/official-leijun-speech.mp4", startFrom: 136 },        // [136-160] Engineering macro: camera lens, concentric rings, colorful reflections (abstract, no text)
    narration2: { file: "videos/official-su7-showroom.mp4", startFrom: 240 },        // [240-258] Auto show: multiple car brands, exhibition atmosphere
    map: { file: "videos/official-china-ev-streets.mp4", startFrom: 180 },           // [180-198] BBC: Chinese city roads, EV infrastructure
    narration3: { file: "videos/official-su7-factory.mp4", startFrom: 132 },         // [132-150] Teal SU7 in wind tunnel + illuminated factory tunnel + fleet
    ending: { file: "videos/official-xiaomi-su7-reveal.mp4", startFrom: 68 },        // [68-84] Aerial top-down SU7 on straight road through snowy terrain
  },
};
