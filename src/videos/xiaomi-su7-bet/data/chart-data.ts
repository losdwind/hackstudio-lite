/**
 * Verified data points for xiaomi-su7-bet animation overlays.
 * All sources documented in research/xiaomi-su7-bet/facts.md.
 */

export const priceCompareData = {
  cn: {
    su7Label: "小米 SU7",
    taycanLabel: "保时捷 Taycan",
    su7Sub: "起售价",
    taycanSub: "起售价",
  },
  en: {
    su7Label: "Xiaomi SU7",
    taycanLabel: "Porsche Taycan",
    su7Sub: "Starting price",
    taycanSub: "Starting price",
  },
  su7Price: 215_900,
  taycanPrice: 898_000,
  currency: "¥",
} as const;

export const specGridData = {
  cn: [
    { label: "零百加速", value: "2.78", unit: "秒" },
    { label: "最高时速", value: "265", unit: "km/h" },
    { label: "CLTC 续航", value: "800", unit: "km" },
  ],
  en: [
    { label: "0 to 100 km/h", value: "2.78", unit: "sec" },
    { label: "Top speed", value: "265", unit: "km/h" },
    { label: "CLTC range", value: "800", unit: "km" },
  ],
} as const;

export const orderCounterData = {
  cn: {
    headline: "24 小时订单",
    suffix: "辆",
    context: "截至 2024 年 3 月 29 日",
  },
  en: {
    headline: "Pre-orders in 24 hours",
    suffix: "units",
    context: "As of March 29, 2024",
  },
  final: 88_898,
} as const;

export const ecosystemData = {
  cn: {
    title: "澎湃 OS 生态",
    nodes: ["手机", "汽车", "家居", "可穿戴"],
    center: "HyperOS",
    caption: "一台电动车，不是一个产品。是生态的入口。",
  },
  en: {
    title: "HyperOS Ecosystem",
    nodes: ["Phone", "Car", "Home", "Wearables"],
    center: "HyperOS",
    caption: "An EV isn't a product. It's an entry point.",
  },
} as const;
