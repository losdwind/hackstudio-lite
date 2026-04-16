import { loadFont as loadNotoSansSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlusJakartaSans } from "@remotion/google-fonts/PlusJakartaSans";

// Display/Headline font — authoritative, tight letter-spacing
export const { fontFamily: plusJakartaSans } = loadPlusJakartaSans();

// Body/Label font — Swiss-style neutrality
export const { fontFamily: inter } = loadInter();

// Chinese font — CJK support
export const { fontFamily: notoSansSC } = loadNotoSansSC();

// Display font (headlines, hero data) — Plus Jakarta Sans or Noto Sans SC for CN
export const getDisplayFont = (lang: "cn" | "en") =>
  lang === "cn" ? notoSansSC : plusJakartaSans;

// Body font (labels, data, narration) — Inter or Noto Sans SC for CN
export const getBodyFont = (lang: "cn" | "en") =>
  lang === "cn" ? notoSansSC : inter;
