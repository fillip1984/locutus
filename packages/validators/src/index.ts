import type { Audio } from "expo-av";
import { z } from "zod";

export const CreatePostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const PlaylistItem = z.object({
  id: z.number().nullish(),
  title: z.string().min(1),
  link: z.string().url(),
  video: z.boolean().default(false),
});

export type PlaylistItemType = z.infer<typeof PlaylistItem>;

export interface PlayerType {
  playing: boolean;
  source?: PlaylistItemType;
  internal?: Audio.Sound;
  positionMillis?: number;
  percentComplete?: number;
  durationMillis?: number;
  durationRemainingMillis?: number;
}
