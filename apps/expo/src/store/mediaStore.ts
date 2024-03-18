import { desc, eq } from "drizzle-orm";

import type { PlaylistItemType } from "@acme/validators";

import { localDb } from "~/db";
import { media } from "~/db/schema";

export const create = async (mediaItem: PlaylistItemType) => {
  const result = localDb
    .insert(media)
    .values({
      title: mediaItem.title,
      link: mediaItem.link,
      video: mediaItem.video,
    })
    .returning();
  return result;
};

export const readAll = async () => {
  const results = await localDb.select().from(media).orderBy(desc(media.title));
  return results;
};

export const readOne = async (id: number) => {
  const results = await localDb.select().from(media).where(eq(media.id, id));

  if (results.length === 1) {
    return results[0];
  } else if (results.length === 0) {
    return null;
  } else if (results.length > 1) {
    throw new Error("More than 1 result found,  id should be unique");
  }
};

export const del = async (id: number) => {
  const result = await localDb
    .delete(media)
    .where(eq(media.id, id))
    .returning({ id: media.id });
  return result;
};
