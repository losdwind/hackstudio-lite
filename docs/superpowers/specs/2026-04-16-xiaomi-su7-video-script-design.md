# Script Design: The $10 Billion Death March

**Date:** 2026-04-16
**Video:** xiaomi-su7
**Duration:** ~20 minutes (5 parts, 40 narration lines)
**Languages:** CN + EN (bilingual)
**Narration style:** Spoken, conversational. Short sentences. No em dashes, semicolons, or parentheses. Every line must sound natural through TTS and read clean as captions.

---

## Overview

A 5-part YouTube documentary telling the story of Xiaomi's $10B car bet. Uses the A+C hybrid storytelling approach. Lei Jun's personal journey is the emotional spine. The gap between Western perception and Chinese reality is the tension engine. Each part opens with what the West assumes, then reveals what actually happened through Lei Jun's own words.

**Tone:** Passionate, emotionally invested. Not neutral analysis. The narrator cares about this story.
**TTS:** `English_PassionateWarrior` (EN), `Chinese(Mandarin)_News_Anchor` (CN), with `voice_modify: { intensity: 40, pitch: 15, timbre: 10 }`.

---

## Technical Structure

### Remotion Pipeline Changes

The current pipeline supports 4 parts. Expanding to 5 requires:

1. **New directory:** `src/videos/xiaomi-su7/components/part5/`
2. **New Part5 component** importing shared `PartRenderer`
3. **Update `MasterComposition.tsx`** to include Part 5 in TransitionSeries
4. **Update `index.tsx`** to register 5-part compositions
5. **New data files:** `content-cn.ts` and `content-en.ts` with 5-part structure
6. **New audio slots:** `public/xiaomi-su7/audio/{cn,en}/part5-full.mp3`
7. **Updated `chart-data.ts`** with new animation data for 5-part structure
8. **Updated `broll-manifest.ts`** with 5-part B-roll assignments
9. **Regenerate:** `audio-manifest.ts`, `alignment-manifest.ts` via `generate-tts.ts`

### Content File Format

```typescript
export const contentCN = {
  part1: {
    title: string,
    subtitle: string,
    narration: string[],  // 7-10 lines per part
    // chart/animation labels...
  },
  // ... part2 through part5
};
```

---

## Part 1: "The Convergence" (~3.5 min, 7 lines)

**Emotional arc:** Curiosity, then realization
**Western lens opener:** "Phone company chases EV hype"
**B-roll focus:** China EV streets, Xiaomi stores, SU7 hero shots

### EN Narration

| # | EN |
|---|-----|
| 1 | In 2024, a Chinese phone company delivered 136,000 electric cars in its first year. Apple tried to do the same thing. They spent ten years and ten billion dollars. Then they quit. |
| 2 | From the outside, this looks like hype chasing. Another phone maker jumping on the EV bandwagon. But inside Xiaomi's headquarters, the story was completely different. |
| 3 | Lei Jun's best engineers were leaving. The people who built Xiaomi into an 80 billion dollar company were sending their resumes to car companies. Not for higher pay. For a different future. |
| 4 | A traditional car executive told Lei Jun something that changed everything. He said a smart electric car is just a big phone with four wheels. That line came from a car guy, not a tech person. And it made the whole problem clear. |
| 5 | China's EV penetration went from under five percent in 2019 to nearly 48 percent by 2024. That is the fastest consumer technology replacement in human history. By December, electric cars outsold gasoline cars for the first time. |
| 6 | If you only make phones, the car companies will take your users. If you only make cars, the phone companies will take yours. These two industries didn't merge by choice. Smart driving, connected ecosystems, and software defined hardware made them the same industry. |
| 7 | And Lei Jun, the engineer who built Xiaomi from nothing into a global top three smartphone company, didn't want to do any of this. |

### CN Narration

| # | CN |
|---|-----|
| 1 | 2024年，一家中国手机公司第一年就交付了13.6万辆电动汽车。苹果也试过同样的事。花了十年，花了一百亿美元。然后放弃了。 |
| 2 | 从外面看，这像是在追风口。又一家手机公司跳上了电动车的热潮。但在小米内部，故事完全不同。 |
| 3 | 雷军最好的工程师正在离开。那些把小米做到800亿美元的人，开始向汽车公司投简历。不是为了更高的薪水，而是为了一个不同的未来。 |
| 4 | 一位传统车企的老板对雷军说了一句话，改变了一切。他说，智能电动汽车不就是一个大号手机带四个轮子吗。这话是从一个造车的人嘴里说出来的，不是搞科技的。这让整个问题变得清晰了。 |
| 5 | 中国的新能源车渗透率，从2019年不到5%，到2024年飙升到47.9%。这是人类历史上最快的消费品替换速度。到12月份，电动车的销量第一次超过了燃油车。 |
| 6 | 如果你只做手机，车企会抢走你的用户。如果你只做车，手机公司会抢走你的。这两个行业不是自己要合并的。是智能驾驶、互联生态、软件定义硬件，把它们变成了同一个行业。 |
| 7 | 而雷军，这个从零开始把小米做到全球前三的工程师，一开始根本不想干这件事。 |

**Animations:** EV penetration line chart (4.7% to 47.9%), Xiaomi timeline (2010-2024)

---

## Part 2: "向死而生 — The Death March" (~5 min, 10 lines)

**Emotional arc:** Dread, weight, then steel resolve
**Western lens opener:** "Another $10B cash burn"
**B-roll focus:** Lei Jun on stage, dark cinematic shots, factory aerial

### EN Narration

| # | EN |
|---|-----|
| 1 | Lei Jun banned internal discussions about making cars. He did it twice. He'd invested in NIO and XPeng, but only as a spectator. He watched the carnage from the sidelines. The bankruptcies. The broken dreams. He wanted no part of it. |
| 2 | In his own words, personally, I didn't want to do this. He was fifty years old. He was thinking about retirement. He was training young leaders to take over. The car was never part of the plan. |
| 3 | But the board saw what Lei Jun was trying to ignore. If Xiaomi doesn't move forward, the talent walks out the door. The relevance fades. The future belongs to someone else. |
| 4 | So Lei Jun did what an engineer does. He ran a full audit of the auto industry. Seventy five days. Two hundred experts. Two hundred and fifty meetings. Not reading reports. Sitting across from people who spent their whole lives building cars. |
| 5 | What he found scared him. Smart EVs have smartphone economics. Huge R&D costs, but almost zero cost to copy once you succeed. That means winner takes all. His estimate was five to eight companies survive globally. You can count them on your fingers. Tesla. BYD. Toyota. Volkswagen. There might not be room for anyone else. |
| 6 | Then Apple quit. Ten years. Ten billion dollars. Two thousand engineers. The richest company on the planet couldn't do it. Lei Jun's first reaction was shock. His second was a little secret joy. One less giant fighting for a seat at the table. |
| 7 | He walked into the boardroom and said this requires a hundred billion RMB and ten years. Every yuan is the blood and sweat of our shareholders. But without this level of commitment, we will die halfway through. |
| 8 | The board said fine. But you lead it. Personally. Not a hired CEO. Not a side project. You. Both sides locked in. No exit. No backup plan. |
| 9 | He later called this path 向死而生. Finding life through death. Not optimism. Not bravado. Just a clear eyed acceptance that the odds are maybe one in ten thousand. But doing nothing is a hundred percent fatal. |
| 10 | Now he had the money and the mandate. But a harder question was waiting. Why do the most powerful companies in the world keep failing at exactly this kind of bet? |

### CN Narration

| # | CN |
|---|-----|
| 1 | 雷军禁止公司讨论造车。禁了两次。他投资了蔚来和小鹏，但只是旁观者。他在一旁看着。看着资金危机，看着破产边缘，看着梦想破碎。他不想参与。 |
| 2 | 用他自己的话说，就我个人角度来讲，我是不想干的。他当时五十岁，在想退休的事。在培养年轻人来接班。造车从来不在他的计划里。 |
| 3 | 但董事会看到了雷军不愿面对的事实。如果小米不往前走，人才会走掉，竞争力会消退，未来会属于别人。 |
| 4 | 于是雷军做了工程师该做的事。他对整个汽车行业做了一次全面的调研。七十五天，两百位专家，两百五十场会议。不是看报告。是坐在造了一辈子车的人面前，一个一个请教。 |
| 5 | 他的发现让他害怕。智能电动车有手机一样的经济模型。研发成本巨大，但一旦做成，复制成本几乎为零。这意味着赢家通吃。他的判断是全球最终只能活五到八家。掰着手指数，特斯拉，比亚迪，丰田，大众。可能已经没有位置了。 |
| 6 | 然后苹果放弃了。十年，一百亿美元，两千名工程师。全世界最有钱的公司，做不成。雷军的第一反应是震惊。第二反应是多少有点小窃喜。牌桌上又少了一个对手。 |
| 7 | 他走进董事会说，这件事需要一百亿美金，十年时间。每一分钱都是小米股东的血汗钱。但如果没有这样的准备，我们很容易打到一半就挂了。 |
| 8 | 董事会说行，但你来领军。你亲自干。不是找个人来对付，不是搞个子公司。你。双方锁定。没有退路，没有备选方案。 |
| 9 | 他后来管这条路叫向死而生。不是乐观，不是逞强。只是清醒地接受，成功的概率可能是万分之一。但什么都不做，那就是百分之百的死亡。 |
| 10 | 现在他有了钱，有了授权。但一个更难的问题在等着他。为什么全世界最强大的公司，总是在这种跨界上失败？ |

**Animations:** Investment comparison bar chart, Global survivor count (5-8 slots), Apple Titan timeline

---

## Part 3: "Why Big Companies Die" (~4 min, 8 lines)

**Emotional arc:** Intellectual intensity, self awareness, humility
**Western lens opener:** "Xiaomi has no auto experience"
**B-roll focus:** Factory production, robotic assembly, Lei Jun presenting

### EN Narration

| # | EN |
|---|-----|
| 1 | Spring Festival 2022. Everyone else was on vacation. Lei Jun cancelled everything. For twenty straight days, nine AM to midnight, he sat his entire leadership team down and asked one question. How will we die? |
| 2 | They studied the wreckage. Microsoft bought Nokia for seven billion dollars and wrote it all off. Intel poured billions into mobile chips and never cracked the market. The most powerful companies in the world, with unlimited money, failing completely at new things. |
| 3 | They found three killers. The first one is idol complex. We have the brand, the talent, the money, how can we fail? Microsoft thought mobile OS would be easy. Intel thought phone chips were trivial. That arrogance destroyed them. |
| 4 | The second killer is habitual thinking. Using methods built for scaling from ten to a hundred on problems that need you to go from zero to one. It's like filming a Hollywood commercial when your audience lives on TikTok. The whole approach is wrong and you can't see it because it's all you've ever known. |
| 5 | The third is cognitive error. Not realizing you're starting from zero. Xiaomi's teams kept proposing world's first and world's best goals. Lei Jun made a rule. He called it the Crime of Firstness. You prove every claim with evidence or you drop it. |
| 6 | His strategy had a name. 守正出奇. Be orthodox first, then surprise them. Get on the poker table before you try to flip it. Apple failed because they wanted to change everything on day one. Lei Jun chose humility. Make a great car first. Disrupt later. |
| 7 | Then he did the opposite of cutting corners. He went all in. Three thousand four hundred engineers when the standard was three hundred. Six hundred test vehicles when others used seventy. Five point four million kilometers of testing across three hundred cities. Porsche bragged about three million kilometers for their latest car. Xiaomi beat them by eighty percent. |
| 8 | The philosophy was locked in. The money was committed. The team was massive. Now came the part that would keep Lei Jun awake for three straight years. Actually building the car. |

### CN Narration

| # | CN |
|---|-----|
| 1 | 2022年春节。别人都在放假。雷军取消了所有安排。连续二十多天，早上九点到午夜，他让整个管理层坐下来，只问一个问题。我们会怎么死？ |
| 2 | 他们研究了失败的案例。微软花七十亿美元买了诺基亚，全部打了水漂。英特尔砸了几十亿做手机芯片，始终做不成。全世界最强大的公司，要钱有钱，要人有人，跨界做新业务照样惨败。 |
| 3 | 他们找到了三个致命原因。第一个叫偶像包袱。我有品牌，有人才，有钱，怎么可能失败？微软觉得做手机系统很简单。英特尔觉得手机芯片不难。这种傲慢把他们毁了。 |
| 4 | 第二个叫惯性思维。用从10到100的方法去解决从0到1的问题。就像在短视频时代还在拍电视广告。拍出来的东西像演戏，消费者直接划走。整个路子就是错的，但你看不见，因为你一直就是这么干的。 |
| 5 | 第三个叫认知错误。不承认自己是从零开始。小米内部总有人提世界唯一、世界第一。雷军定了个规矩叫唯一第一罪。你凭什么？拿证据来。拿不出来就收回。 |
| 6 | 他的战略叫守正出奇。先上牌桌，不要没上桌就把桌子掀了。苹果失败是因为想一上来就颠覆一切。雷军选了另一条路。先把车做好，再谈革命。 |
| 7 | 然后他做了所有人意想不到的事。不是抄近路，是十倍投入。三千四百名工程师，行业标准只有三四百。六百辆测试车，行业标准是七十到两百。三百个城市，五百四十万公里路测。保时捷前几天发新车，骄傲地说测了三百万公里。小米比他们多了百分之八十。 |
| 8 | 方法论定了，钱到位了，团队组好了。接下来三年，才是真正让雷军睡不着觉的部分。把车造出来。 |

**Animations:** Three Fatal Sins diagram, 10x investment infographic, China testing map

---

## Part 4: "The Battle" (~4 min, 8 lines)

**Emotional arc:** Obsession, tension, catharsis
**Western lens opener:** "It's just a Tesla clone"
**B-roll focus:** Nurburgring racing, auto show, SU7 design details, CNBC sales data

### EN Narration

| # | EN |
|---|-----|
| 1 | Lei Jun borrowed a hundred and seventy different cars. He drove each one for a day or two and asked every owner the same questions. Why did you buy this car? What do you love about it? What's broken? He went to dealerships himself. Every quarter, he bought two new cars just to understand what the buying experience feels like. |
| 2 | He got a racing license. He learned to drift. He bought a six axis driving simulator. Then he made fifty of his top executives do the same thing. His logic was simple. If you don't know what a car feels like at its limits, you can't tell a good one from a bad one. |
| 3 | He went to Heihe for winter testing. Minus fifty degrees. The engineers there normally ate three dish meals. They added a fourth dish because the chairman showed up. Everyone was so happy about the extra dish. Then Turpan in summer. Fifty degrees outside. The car's interior hit ninety degrees after sitting in the sun. The door handles would burn your skin. But the local watermelons were five yuan each and absolutely incredible. |
| 4 | The SU7 wasn't designed by gut feeling. Lei Jun had over ten thousand photos of cars saved on his tablet. His team analyzed proportions with math. Wheel to body ratio. Width to height ratio. They figured out what beauty actually means in numbers. They chose rounded lines because data showed over thirty percent of buyers would be women. Nobody in the industry expected that. |
| 5 | The pricing debate lasted three months. One camp wanted 199,000 yuan. Lei Jun held firm at 215,900. His argument was that just over 200,000 feels like a luxury car. 199,000 feels cheap. The compromise was the higher price plus three free accessories. Leather seats, premium sound system, and a fridge. He told his team, you have no idea how much we're losing on every car. |
| 6 | Before the launch, twenty automotive media people were invited for a preview. Eighteen said it would fail. A pure electric sedan, not an SUV, in this market? Dead on arrival. One of them bet Lei Jun that female buyers would be under five percent. The real number was over thirty. |
| 7 | March 28, 2024. Exactly three years after the announcement. Two days ahead of schedule. Twenty seven minutes after the launch event, fifty thousand orders came in. The internal prediction had been maybe five thousand a month if they were lucky. Even Lei Jun was stunned. He said the result was three to five times what anyone expected, including himself. |
| 8 | First year deliveries. 136,854 cars. But for Lei Jun, the SU7 was never the destination. It was the key that unlocked something much bigger. |

### CN Narration

| # | CN |
|---|-----|
| 1 | 雷军借了一百七十辆不同的车。每辆开一两天，问每个车主一样的问题。你为什么买这辆车？喜欢什么？哪里不好？他亲自去4S店。每个季度买两辆新车，就为了体验消费者的感觉。 |
| 2 | 他考了赛车执照，学了漂移，买了一台六轴模拟器。然后让五十多位高管也去学。他的道理很简单。如果你不知道车在极限状态下是什么感觉，你就分不清好车和差车。 |
| 3 | 他去了黑河做冬测。零下五十度。工程师平时吃三个菜，因为老板来了加了一个。大家可高兴了。然后是吐鲁番。五十多度。车在太阳底下停了一两个小时，车里温度到九十度。门把手烫得不得了。但那儿的西瓜五块钱一个，好吃极了。 |
| 4 | SU7不是靠直觉设计的。雷军的平板里存了上万张车的图片。团队用数学分析比例。轮走比，宽高比。他们算出来好看到底是什么意思。他们选了圆润的线条，因为数据显示超过30%的买家是女性。整个行业都没想到。 |
| 5 | 定价争论了三个月。一派坚持十九万九。雷军坚持二十一万五千九。他说二十万出头有豪华感，十九万九显得便宜。最后的妥协是高价加三大件赠送。真皮座椅，高级音响，冰箱。他跟团队说，你们不当家不知柴米油盐贵。 |
| 6 | 发布前请了二十多位汽车媒体来看。十八位说会失败。纯电轿车，不是SUV，在这个市场，必死。其中一个跟雷军打赌，说女性买家不会超过5%。实际数字，超过30%。 |
| 7 | 2024年3月28日，距宣布造车整整三年，提前两天。发布会后二十七分钟，五万订单。内部预期是月销一万就是爆品。连雷军自己都震惊了。他说，比所有人预期的高了三到五倍，包括我自己。 |
| 8 | 第一年交付13万6854辆。但对雷军来说，SU7从来不是终点。它是打开更大世界的钥匙。 |

**Animations:** SU7 vs Model 3 spec comparison, Pricing scale, Order counter (50K in 27 min), Sales milestone

---

## Part 5: "The Real Game" (~3.5 min, 7 lines)

**Emotional arc:** Scale, vision, provocation
**Western lens opener:** "Another Chinese EV brand"
**B-roll focus:** Ecosystem products, orchestra finale, epic landscape driving

### EN Narration

| # | EN |
|---|-----|
| 1 | When a Xiaomi phone user walks toward the SU7, the car unlocks by itself. You sit down and your phone connects to the dashboard. You can take a video call on the car's big screen. You can turn on your home AC from the steering wheel. This isn't a feature list. It's an operating system for your entire day. |
| 2 | Nine hundred million Xiaomi devices are connected around the world. TVs, air purifiers, robot vacuums, earbuds, watches, phones, and now the car. Every device makes the others harder to leave. Every new connection raises the cost of switching to a competitor. |
| 3 | Apple understood this. CarPlay was the proof. They knew the phone and the car had to talk to each other. But building a car means mastering 140 years of manufacturing complexity. Apple wanted to skip the learning curve and flip the table on day one. That cost them ten billion dollars and a decade of work. |
| 4 | Xiaomi could have made a separate brand for the car. Like Toyota made Lexus. The internal debate was intense. Lei Jun's argument won. He said Xiaomi Auto is inseparable from Xiaomi. Person, car, home. We win together or we lose together. A customer's trust in a twenty dollar power bank becomes trust in a thirty thousand dollar car. That trust is the real moat. |
| 5 | This isn't Xiaomi versus Tesla. This is ecosystem versus ecosystem. The real question isn't who builds the best car. It's who owns the user across every device in their life. BYD wins on scale and price. Tesla wins on brand and autonomy. Xiaomi is betting that when the moat becomes nine hundred million connected devices, the whole game changes. |
| 6 | In 2024, a man who was thinking about retirement bet ten billion dollars on a product he never wanted to build. Because he realized that not building it was the only thing more dangerous than building it. Three years later, that car outsold the Model 3 in China. |
| 7 | 向死而生. Finding life through death. It's not a slogan. For the next twenty years of the smart device era, it might be the only strategy that works. |

### CN Narration

| # | CN |
|---|-----|
| 1 | 当小米手机用户走向SU7，车门自动打开。坐进去，手机自动和车机连接。你可以在车的大屏上开视频会议。你可以在方向盘上控制家里的空调。这不是功能列表，这是覆盖你一整天的操作系统。 |
| 2 | 全球有九亿台小米设备联网。电视，空气净化器，扫地机器人，耳机，手表，手机，现在加上了车。每多一台设备，其他的就更难被替代。每多一个连接，换到竞品的代价就更高。 |
| 3 | 苹果其实看懂了。CarPlay就是证据，他们知道手机和车必须互联。但造车意味着要征服140年积累的制造复杂度。苹果想跳过学习过程，一上来就颠覆。这个想法花了他们一百亿美元和十年时间。 |
| 4 | 小米完全可以为汽车做一个新品牌。就像丰田做了雷克萨斯。内部争论非常激烈。最后是雷军的观点赢了。他说小米汽车是小米不可分割的一部分。人车家全生态，要赢一起赢，要输一起输。用户对一个二十块充电宝的信任，变成对三十万汽车的信任。这种信任才是真正的护城河。 |
| 5 | 这不是小米对特斯拉。这是生态对生态。真正重要的问题不是谁造了最好的车。是谁拥有用户生活中的每一个设备。比亚迪赢在规模和价格。特斯拉赢在品牌和自动驾驶。小米赌的是，当护城河变成九亿台联网设备，整个游戏的规则就变了。 |
| 6 | 2024年，一个在考虑退休的人，把一百亿美元押在了一个他不想做的产品上。因为他想明白了，不做这件事，才是唯一比做更危险的选择。三年后，这辆车在中国的月销量超过了特斯拉Model 3。 |
| 7 | 向死而生。不是口号。在未来二十年的智能设备时代，这可能是唯一有效的战略。 |

**Animations:** Ecosystem rings (Person/Car/Home), Apple vs Xiaomi path diagram, Global expansion map

---

## Implementation Sequence

1. Write `content-cn.ts` and `content-en.ts` (5-part narration)
2. Update `chart-data.ts` (new animations for 5-part structure)
3. Create `src/videos/xiaomi-su7/components/part5/` with Part5 component
4. Update `MasterComposition.tsx` for 5-part TransitionSeries
5. Update `index.tsx` to register 5-part compositions
6. Update `broll-manifest.ts` with 5-part B-roll assignments per `visuals.md`
7. Run `bun run scripts/generate-tts.ts --video xiaomi-su7` to generate all audio
8. Preview in Remotion Studio, iterate on timing
9. Render final CN + EN versions
