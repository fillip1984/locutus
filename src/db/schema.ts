import { createId } from "@paralleldrive/cuid2";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const baseFields = {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
};

export const librarySchema = sqliteTable("library", {
  ...baseFields,
  remoteId: text().notNull().unique(),
  name: text().notNull(),
});

export type librarySchemaType = typeof librarySchema.$inferSelect;

export const libraryItemSchema = sqliteTable(
  "libraryItem",
  {
    ...baseFields,
    remoteId: text().notNull(),
    title: text().notNull(),
    subtitle: text(),
    authorName: text().notNull(),
    authorNameLF: text(),
    publishedYear: integer(),
    description: text(),
    isbn: text(),
    asin: text(),
    coverArtPath: text(),
    audiobookLocation: integer(),
    audiobookDuration: integer(),
    audiobookProgress: integer(),
    ebookLocation: text(),
    ebookProgress: integer(),
    isAudiobook: integer({ mode: "boolean" }).notNull().default(false),
    isEbook: integer({ mode: "boolean" }).notNull().default(false),
    downloaded: integer({ mode: "boolean" }).notNull().default(false),
    complete: integer({ mode: "boolean" }).notNull().default(false),
    libraryId: text()
      .notNull()
      .references(() => librarySchema.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("library_item_remote_id_library_id_idx").on(
      t.remoteId,
      t.libraryId,
    ),
  ],
);

export type libraryItemSchemaType = typeof libraryItemSchema.$inferSelect;
export type libraryItemWithFilesSchemaType = libraryItemSchemaType & {
  audioChapters: audioChapterSchemaType[];
  ebook: ebookSchemaType | null;
};

export const ebookSchema = sqliteTable("ebook", {
  ...baseFields,
  remoteId: text().notNull().unique(),
  ebookFormat: text().notNull(),
  libraryItemId: text()
    .notNull()
    .references(() => libraryItemSchema.id, { onDelete: "cascade" }),
});

export type ebookSchemaType = typeof ebookSchema.$inferSelect;

export const audioChapterSchema = sqliteTable(
  "audioChapter",
  {
    ...baseFields,
    index: integer().notNull(),
    title: text().notNull(),
    start: integer().notNull(),
    end: integer().notNull(),
    // media file info
    mediaRemoteId: text().notNull(),
    mediaFormat: text().notNull(),
    duration: integer().notNull(),
    libraryItemId: text()
      .notNull()
      .references(() => libraryItemSchema.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("audio_chapter_index_library_item_id_idx").on(
      t.index,
      t.libraryItemId,
    ),
  ],
);

export type audioChapterSchemaType = typeof audioChapterSchema.$inferSelect;

export const audioFileSchema = sqliteTable("audioFile", {
  ...baseFields,
  remoteId: text().notNull().unique(),
  mediaFormat: text().notNull(),
  filePath: text().notNull(),
  libraryItemId: text()
    .notNull()
    .references(() => libraryItemSchema.id, { onDelete: "cascade" }),
});

export const seriesSchema = sqliteTable("series", {
  ...baseFields,
  remoteId: text().notNull().unique(),
  name: text().notNull(),
  sequence: integer().notNull(),
  libraryItemId: text()
    .notNull()
    .references(() => libraryItemSchema.id, { onDelete: "cascade" }),
});
export type seriesSchemaType = typeof seriesSchema.$inferSelect;

export const libraryItemGenreSchema = sqliteTable("libraryItemGenre", {
  ...baseFields,
  libraryItemId: text()
    .notNull()
    .references(() => libraryItemSchema.id, { onDelete: "cascade" }),
  genreId: text()
    .notNull()
    .references(() => genreSchema.id, { onDelete: "cascade" }),
});
export type libraryItemGenreSchemaType =
  typeof libraryItemGenreSchema.$inferSelect;

export const genreSchema = sqliteTable("genre", {
  ...baseFields,
  remoteId: text().notNull().unique(),
  name: text().notNull(),
});
export type genreSchemaType = typeof genreSchema.$inferSelect;

// TODO: add tags? Looks like they compliment genres so it may be possible to shove both of them in there

export const userSettingsSchema = sqliteTable("userSettings", {
  ...baseFields,
  serverUrl: text().notNull(),
  signInWithBiometrics: integer({
    mode: "boolean",
  })
    .notNull()
    .default(false),
  preferredPlaybackRate: integer().notNull().default(1),
  lastServerSync: integer({ mode: "timestamp" }),
});

export type UserSettingsSchemaType = typeof userSettingsSchema.$inferSelect;
