import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const libraryItemSchema = sqliteTable("libraryItem", {
  ...baseFields,
  remoteId: text().notNull(),
  title: text().notNull(),
  authorName: text().notNull(),
  authorNameLF: text(),
  numAudioFiles: integer().notNull(),
  ebookFileFormat: text(),
  duration: integer().notNull(),
  publishedYear: integer(),
  description: text(),
  isbn: text(),
  asin: text(),
  coverArtPath: text(),
  lastPlayedId: text(),
  lastEBookId: text(),
  downloaded: integer({ mode: "boolean" }).default(false),
  complete: integer({ mode: "boolean" }).default(false),
  libraryId: text()
    .notNull()
    .references(() => librarySchema.id),
});

export type libraryItemSchemaType = typeof libraryItemSchema.$inferSelect;
export type libraryItemWithFilesSchemaType = libraryItemSchemaType & {
  audioFiles: audiobookSchemaType[];
  eBookFiles: eBookFileSchemaType[];
};

export const audioFileSchema = sqliteTable("audioFile", {
  ...baseFields,
  remoteId: text().notNull().unique(),
  index: integer().notNull(),
  duration: integer().notNull(),
  start: integer().notNull(),
  end: integer().notNull(),
  progress: integer(),
  complete: integer({ mode: "boolean" }).default(false),
  name: text().notNull(),
  path: text(),
  libraryItemId: text()
    .notNull()
    .references(() => libraryItemSchema.id),
});

export type audiobookSchemaType = typeof audioFileSchema.$inferSelect;

export const eBookFileSchema = sqliteTable("eBookFile", {
  ...baseFields,
  remoteId: text().notNull().unique(),
  currentLocation: text(),
  progress: integer(),
  complete: integer({ mode: "boolean" }).default(false),
  name: text().notNull(),
  path: text(),
  libraryItemId: text()
    .notNull()
    .references(() => libraryItemSchema.id),
});

export type eBookFileSchemaType = typeof eBookFileSchema.$inferSelect;

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
