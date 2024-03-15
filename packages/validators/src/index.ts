import { z } from "zod";

export const CreatePostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const PlaylistItem = z.object({
  title: z.string().min(1),
  link: z.string().url(),
  video: z.boolean(),
});

export type PlaylistItemType = z.infer<typeof PlaylistItem>;
