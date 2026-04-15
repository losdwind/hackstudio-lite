import { loadFont as loadNotoSansSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const { fontFamily: notoSansSC } = loadNotoSansSC();
export const { fontFamily: inter } = loadInter();

export const getFontFamily = (lang: "cn" | "en") =>
  lang === "cn" ? notoSansSC : inter;
