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
    audioChapters: r.many.audioChapterSchema({
      from: r.libraryItemSchema.id,
      to: r.audioChapterSchema.libraryItemId,
    }),
    ebook: r.one.ebookSchema({
      from: r.libraryItemSchema.id,
      to: r.ebookSchema.libraryItemId,
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
}));
