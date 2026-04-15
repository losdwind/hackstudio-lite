import { z } from "zod/v4";

export const VideoSchema = z.object({
  lang: z.enum(["cn", "en"]),
});

export type VideoProps = z.infer<typeof VideoSchema>;
export type Lang = VideoProps["lang"];
