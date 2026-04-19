/**
 * English narration for "He Said He'd Never Build a Car. Then He Bet $10 Billion On It."
 *
 * TTS-friendly style:
 *   - Short sentences, periods and commas only
 *   - No em dashes, semicolons, colons, parentheses
 *   - Contractions are fine
 */

export type PartContent = {
  title: string;
  subtitle: string;
  narration: string[];
};

export const contentEN: Record<string, PartContent> = {
  part1: {
    title: "Hesitation",
    subtitle: "The man who said he'd never build a car",
    narration: [
      "In 2013, a man sat in Tesla's factory, test-driving a Model S. His name was Lei Jun. He said he would never build cars.",
      "Eight years later, he broke his promise. At 52, a billionaire CEO stood on a stage and said he was doing it. And he was staking his reputation on it.",
      "Every Western headline ran with the same framing. Another phone company chasing cars. Destined to fail. Just like Apple.",
      "But they missed something. Lei Jun wasn't trying. He was going all in.",
      "His exact words were these. This is my final major entrepreneurial project. I'm willing to stake my entire reputation on it.",
      "A CEO who stakes his entire reputation. What did he see. What did the West miss.",
      "That's the story we're unpacking today.",
    ],
  },
  part2: {
    title: "Gravitational Pull",
    subtitle: "Where Chinese tech talent is actually flowing",
    narration: [
      "Spring 2021. Xiaomi's offices start losing engineers. Not to ByteDance or Tencent. They're leaving to build cars.",
      "Within a year, over thirty-four hundred engineers joined the Xiaomi EV team. Core talent from Huawei, Nio, BMW, Geely.",
      "In Silicon Valley, engineers quit to join AI startups. In China, they quit to build electric vehicles.",
      "The reason is simple. In China, an EV isn't a product. It's an entry point to an ecosystem.",
      "Phone. Car. Home appliances. Operating system. All of it connected. They call it HyperOS.",
      "Apple spent ten full years and ten billion dollars on its car project. Then walked away.",
      "Xiaomi did it in three. Because the entire Chinese supply chain was pushing him forward.",
    ],
  },
  part3: {
    title: "The Bet",
    subtitle: "Porsche specs, one fifth the price",
    narration: [
      "March 28, 2024. Xiaomi SU7 officially launches.",
      "Starting price, twenty-one thousand US dollars. Top trim, under forty-two thousand. One third of a Porsche Taycan.",
      "But the specs aren't one-third. They match across the board.",
      "Zero to sixty in 2.78 seconds. Top speed 265 kilometers per hour. Range, 800 kilometers.",
      "Here's what that means. Five years ago, only three cars in the world hit those numbers. Mercedes. Porsche. Tesla Plaid.",
      "Now a company that started building cars in 2021 hits them too. At one-fifth the price.",
      "Lei Jun paused for three full seconds on stage. He said. This isn't a victory for one company. This is a victory for China's entire manufacturing base.",
    ],
  },
  part4: {
    title: "Reckoning",
    subtitle: "A CEO America can't build anymore",
    narration: [
      "Twenty-four hours after launch, SU7 had eighty-eight thousand pre-orders.",
      "Western analysts started walking back their takes. They said. Maybe this isn't just another phone company chasing cars.",
      "What Apple couldn't build in ten years, Xiaomi shipped in three. The answer sits in what each CEO chose to bet.",
      "Tim Cook played it safe. Told shareholders a steady story. Killed the project when it didn't pencil out.",
      "Lei Jun bet everything. His reputation on the line. No safety net.",
      "This is two CEO archetypes colliding. One, the professional manager. The other, the founder going all in.",
      "So when people ask, is Lei Jun the next Steve Jobs. I think that's the wrong question. The real question is, can America still produce a CEO willing to bet like Lei Jun.",
    ],
  },
};
