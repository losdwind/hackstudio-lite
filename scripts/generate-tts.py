#!/usr/bin/env python3
"""Generate TTS voiceover audio files using edge-tts for both CN and EN."""

import asyncio
import edge_tts
import os
import json

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio")

CN_VOICE = "zh-CN-YunyangNeural"
EN_VOICE = "en-US-ChristopherNeural"
CN_RATE = "-5%"
EN_RATE = "-5%"

# Each section now has narration for EVERY sequence (including over animations)
# Format: (filename, text)

CN_LINES = [
    # Part 1 (6 lines: narr + narr + chart_voiceover + narr + timeline_voiceover + narr)
    ("part1-line1", "2010年，小米成立。它的模式很简单：把手机做到极致性价比，把利润留给软件和服务。"),
    ("part1-line2", "十年后，小米有了5亿台联网设备、370亿美元年营收。但在全球汽车投资人眼里，它仍然只是一家便宜手机公司。"),
    ("part1-line3", "2020年，新能源车的渗透率不到6%。到2024年，接近48%。这是人类历史上最快的消费品品类替换速度。"),
    ("part1-line4", "与此同时，中国的电动车市场正在发生一件不可思议的事。"),
    ("part1-line5", "从MIUI到小米手机，从手环到电视，从IPO到造车。这是一家不断突破边界的公司。"),
    ("part1-line6", "当汽车变成一台有四个轮子的智能设备，手机公司和汽车公司的边界，还有意义吗？"),

    # Part 2 (6 lines)
    ("part2-line1", "2021年初，雷军发现了一个让他彻夜难眠的数据：小米的顶级工程师，开始向汽车公司投简历。"),
    ("part2-line2", "这不是跳槽，这是行业的引力。智能驾驶、车载操作系统、电池管理，这些岗位的薪资溢价正在虹吸科技人才。"),
    ("part2-line3", "从互联网大厂到传统车企，从芯片公司到AI企业，人才正在向汽车行业流动。小米不得不做出选择。"),
    ("part2-line4", "雷军做了一个决定：用75天时间，密集访谈200位汽车行业专家。"),
    ("part2-line5", "小米投入100亿美元，是蔚来、小鹏、理想早期融资的数倍。这是一场不留退路的豪赌。"),
    ("part2-line6", "然后他走进董事会：这需要100亿美元和10年时间。少一分钱，少一年，我都不做。"),

    # Part 3 (6 lines)
    ("part3-line1", "他们组建了4000人的造车团队，是同类项目行业平均的3到4倍。"),
    ("part3-line2", "SU7的外形被刻意做圆润，因为数据显示女性用户更喜欢。"),
    ("part3-line3", "价格、续航、加速、马力，SU7在几乎每一项参数上都压过了Model 3。"),
    ("part3-line4", "定价那天，内部吵了6个月。19.9万还是21.59万？"),
    ("part3-line5", "性能与价格的最佳平衡点。21.59万，附赠三大配件。这是小米的答案。"),
    ("part3-line6", "发布会结束27分钟后，5万张订单确认。第一年交付近14万台。"),

    # Part 4 (5 lines)
    ("part4-line1", "小米的成功，证明了一件事：在智能化时代，汽车行业的入场券，不再是百年的造车经验。"),
    ("part4-line2", "以SU7为中心，手机、手表、耳机、电视、空调、路由器，全部连接在一起。这就是人车家全生态。"),
    ("part4-line3", "现在，有超过50家中国科技和消费电子公司，正在以不同形式进入汽车产业链。"),
    ("part4-line4", "从欧洲到东南亚，从中东到南美，中国车企正在加速出海。"),
    ("part4-line5", "真正的问题不是小米能不能活下去，而是：当护城河变了，谁拥有定价权？"),
]

EN_LINES = [
    ("part1-line1", "In 2010, Xiaomi was founded. The model was simple: make phones at extreme value, keep profits in software and services."),
    ("part1-line2", "A decade later, Xiaomi had 500 million connected devices and 37 billion dollars in annual revenue. But to global auto investors, it was still just a cheap phone company."),
    ("part1-line3", "In 2020, new energy vehicle penetration was under 6 percent. By 2024, nearly 48 percent. The fastest consumer category replacement in human history."),
    ("part1-line4", "Meanwhile, something extraordinary was happening in China's electric vehicle market."),
    ("part1-line5", "From MIUI to smartphones, from wearables to TV, from IPO to car manufacturing. A company that keeps breaking boundaries."),
    ("part1-line6", "When a car becomes a smart device on four wheels, does the line between phone companies and car companies still matter?"),

    ("part2-line1", "In early 2021, Lei Jun discovered something that kept him up at night: Xiaomi's top engineers were sending resumes to car companies."),
    ("part2-line2", "This wasn't job-hopping. It was industry gravity. Smart driving, car OS, battery management, these roles were siphoning tech talent with premium salaries."),
    ("part2-line3", "From tech giants to legacy automakers, from chip companies to AI firms, talent was flowing toward the auto industry. Xiaomi had to choose."),
    ("part2-line4", "Lei Jun made a decision: spend 75 days interviewing 200 auto industry experts."),
    ("part2-line5", "Xiaomi committed 10 billion dollars. Several times what NIO, XPeng, and Li Auto raised in their early rounds combined. An all-in bet with no exit."),
    ("part2-line6", "Then he walked into the boardroom: This requires 10 billion dollars and 10 years. Not a penny less, not a year less."),

    ("part3-line1", "They assembled a 4,000-person car team. 3 to 4 times the industry average for similar projects."),
    ("part3-line2", "The SU7's design was deliberately rounded. Data showed female users preferred it."),
    ("part3-line3", "Price, range, acceleration, horsepower. The SU7 beat the Model 3 on nearly every spec."),
    ("part3-line4", "The pricing debate lasted 6 months. 199,000 or 215,900 yuan?"),
    ("part3-line5", "The perfect balance of performance and price. 215,900 yuan, with three premium accessories included. That was Xiaomi's answer."),
    ("part3-line6", "27 minutes after the launch event ended, 50,000 orders were confirmed. First year deliveries: nearly 140,000 units."),

    ("part4-line1", "Xiaomi's success proved one thing: in the smart era, the ticket to the auto industry is no longer a century of manufacturing experience."),
    ("part4-line2", "With the SU7 at the center, phone, watch, earbuds, TV, AC, router, all connected. This is the Person, Car, Home ecosystem."),
    ("part4-line3", "Today, over 50 Chinese tech and consumer electronics companies are entering the auto supply chain."),
    ("part4-line4", "From Europe to Southeast Asia, from the Middle East to South America, Chinese automakers are accelerating their global expansion."),
    ("part4-line5", "The real question is not, can Xiaomi survive. It is: when the moat changes, who owns pricing power?"),
]


async def generate_audio(text: str, voice: str, rate: str, output_path: str):
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(output_path)
    return os.path.getsize(output_path)


async def generate_all():
    os.makedirs(os.path.join(OUTPUT_DIR, "cn"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "en"), exist_ok=True)

    print(f"Generating Chinese narration with {CN_VOICE}...")
    for filename, text in CN_LINES:
        path = os.path.join(OUTPUT_DIR, "cn", f"{filename}.mp3")
        size = await generate_audio(text, CN_VOICE, CN_RATE, path)
        print(f"  done: {filename}.mp3 ({size // 1024}KB)")

    print(f"\nGenerating English narration with {EN_VOICE}...")
    for filename, text in EN_LINES:
        path = os.path.join(OUTPUT_DIR, "en", f"{filename}.mp3")
        size = await generate_audio(text, EN_VOICE, EN_RATE, path)
        print(f"  done: {filename}.mp3 ({size // 1024}KB)")

    print(f"\nDone! {len(CN_LINES)} CN + {len(EN_LINES)} EN = {len(CN_LINES) + len(EN_LINES)} audio files.")


if __name__ == "__main__":
    asyncio.run(generate_all())
