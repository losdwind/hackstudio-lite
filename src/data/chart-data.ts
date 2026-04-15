// China EV Penetration Rate (Animation #01)
export const evPenetrationData = [
  { year: 2019, rate: 4.7 },
  { year: 2020, rate: 5.4 },
  { year: 2021, rate: 13.4 },
  { year: 2022, rate: 25.6 },
  { year: 2023, rate: 31.6 },
  { year: 2024, rate: 47.9 },
];

// Xiaomi Product Timeline (Animation #02)
export const xiaomiTimeline = [
  { year: 2010, event: { cn: "MIUI 发布", en: "MIUI Launch" } },
  { year: 2011, event: { cn: "小米1 发布", en: "Mi 1 Phone" } },
  { year: 2013, event: { cn: "小米电视", en: "Mi TV" } },
  { year: 2014, event: { cn: "小米手环", en: "Mi Band" } },
  { year: 2018, event: { cn: "港交所上市", en: "Hong Kong IPO" } },
  { year: 2021, event: { cn: "宣布造车", en: "Car Announced" } },
  { year: 2024, event: { cn: "SU7 发布", en: "SU7 Launch" } },
];

// Investment Comparison (Animation #04) — in billions of RMB
export const investmentData = [
  { company: { cn: "小米汽车", en: "Xiaomi Auto" }, amount: 100, highlight: true },
  { company: { cn: "蔚来", en: "NIO" }, amount: 35, highlight: false },
  { company: { cn: "小鹏", en: "XPeng" }, amount: 20, highlight: false },
  { company: { cn: "理想", en: "Li Auto" }, amount: 15, highlight: false },
];

// SU7 vs Model 3 Spec Comparison (Animation #05)
export const specComparisonData = [
  {
    label: { cn: "起售价", en: "Starting Price" },
    su7: { value: "21.59万", raw: 21.59 },
    model3: { value: "24.59万", raw: 24.59 },
    winner: "su7" as const,
  },
  {
    label: { cn: "续航(km)", en: "Range (km)" },
    su7: { value: "700", raw: 700 },
    model3: { value: "606", raw: 606 },
    winner: "su7" as const,
  },
  {
    label: { cn: "0-100加速", en: "0-100 km/h" },
    su7: { value: "2.78s", raw: 2.78 },
    model3: { value: "3.1s", raw: 3.1 },
    winner: "su7" as const,
  },
  {
    label: { cn: "马力", en: "Horsepower" },
    su7: { value: "673hp", raw: 673 },
    model3: { value: "513hp", raw: 513 },
    winner: "su7" as const,
  },
  {
    label: { cn: "轴距(mm)", en: "Wheelbase" },
    su7: { value: "3,000", raw: 3000 },
    model3: { value: "2,875", raw: 2875 },
    winner: "su7" as const,
  },
];

// Sales Counter Data (Animation #07)
export const salesData = {
  totalOrders: 50000,
  timeMinutes: 27,
  firstYearDeliveries: 139547,
  secondYearTarget: 300000,
  competitors: [
    { name: { cn: "小米 SU7", en: "Xiaomi SU7" }, firstDayOrders: 50000, highlight: true },
    { name: { cn: "特斯拉 Model 3", en: "Tesla Model 3" }, firstDayOrders: 25000, highlight: false },
    { name: { cn: "小鹏 P7", en: "XPeng P7" }, firstDayOrders: 10000, highlight: false },
    { name: { cn: "蔚来 ET5", en: "NIO ET5" }, firstDayOrders: 8000, highlight: false },
  ],
};

// Talent Flow Sources (Animation #03)
export const talentFlowSources = [
  { name: { cn: "互联网大厂", en: "Tech Giants" }, icon: "💻" },
  { name: { cn: "传统车企", en: "Legacy Auto" }, icon: "🏭" },
  { name: { cn: "芯片公司", en: "Chip Makers" }, icon: "🔧" },
  { name: { cn: "AI 公司", en: "AI Companies" }, icon: "🤖" },
  { name: { cn: "电池企业", en: "Battery Co." }, icon: "🔋" },
];

// Ecosystem Data (Animation #08)
export const ecosystemRings = [
  {
    ring: { cn: "人", en: "Person" },
    items: [
      { cn: "手机", en: "Phone" },
      { cn: "手表", en: "Watch" },
      { cn: "耳机", en: "Earbuds" },
      { cn: "平板", en: "Tablet" },
    ],
  },
  {
    ring: { cn: "车", en: "Car" },
    items: [
      { cn: "SU7", en: "SU7" },
      { cn: "智能驾驶", en: "Smart Drive" },
      { cn: "车载系统", en: "Car OS" },
      { cn: "充电网络", en: "Charging" },
    ],
  },
  {
    ring: { cn: "家", en: "Home" },
    items: [
      { cn: "电视", en: "TV" },
      { cn: "空调", en: "AC" },
      { cn: "路由器", en: "Router" },
      { cn: "扫地机", en: "Vacuum" },
    ],
  },
];

// Global Expansion Map Coordinates (Animation #09)
export const expansionRoutes = [
  { target: { cn: "欧洲", en: "Europe" }, coords: [10, 50] as [number, number] },
  { target: { cn: "东南亚", en: "SE Asia" }, coords: [105, 15] as [number, number] },
  { target: { cn: "中东", en: "Middle East" }, coords: [50, 25] as [number, number] },
  { target: { cn: "南美", en: "South America" }, coords: [-60, -15] as [number, number] },
];

export const chinaCoords: [number, number] = [116.4, 39.9]; // Beijing
