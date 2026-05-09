import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  librarySchema: {
    libraryItems: r.many.libraryItemSchema({
      from: r.librarySchema.id,
      to: r.libraryItemSchema.libraryId,
    }),
  },
  libraryItemSchema: {
    library: r.one.librarySchema({
      from: r.libraryItemSchema.libraryId,
      to: r.librarySchema.id,
    }),
    chapters: r.many.chapterSchema({
      from: r.libraryItemSchema.id,
      to: r.chapterSchema.libraryItemId,
    }),
    audioFiles: r.many.audioFileSchema({
      from: r.libraryItemSchema.id,
      to: r.audioFileSchema.libraryItemId,
    }),
    eBookFiles: r.many.eBookFileSchema({
      from: r.libraryItemSchema.id,
      to: r.eBookFileSchema.libraryItemId,
    }),
    series: r.one.seriesSchema({
      from: r.libraryItemSchema.id,
      to: r.seriesSchema.libraryItemId,
    }),
    genres: r.many.libraryItemGenreSchema({
      from: r.libraryItemSchema.id,
      to: r.libraryItemGenreSchema.libraryItemId,
    }),
  },
  audioFile: {
    libraryItem: r.one.libraryItemSchema({
      from: r.audioFileSchema.libraryItemId,
      to: r.libraryItemSchema.id,
    }),
  },
  eBookFile: {
    libraryItem: r.one.libraryItemSchema({
      from: r.eBookFileSchema.libraryItemId,
      to: r.libraryItemSchema.id,
    }),
  },
}));
