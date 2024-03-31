import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const librarySchema = sqliteTable(
  "library",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    remoteId: text("remoteId").notNull(),
    name: text("name").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (t) => ({
    unq: unique().on(t.remoteId),
  }),
);

export type LibrarySchemaType = typeof librarySchema.$inferSelect;

export const libraryItemSchema = sqliteTable("libraryItem", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  remoteId: text("remoteId").notNull(),
  // ino: text("ino").notNull(),
  title: text("title").notNull(),
  authorName: text("authorName").notNull(),
  numAudioFiles: integer("numAudioFiles").notNull(),
  duration: integer("duration").notNull(),
  publishedYear: integer("publishedYear"),
  description: text("description"),
  isbn: text("isbn"),
  asin: text("asin"),
  coverArtPath: text("coverArtPath"),
  lastPlayedId: integer("lastPlayedId"),
  downloaded: integer("downloaded", { mode: "boolean" }).default(false),
  complete: integer("complete", { mode: "boolean" }).default(false),
  libraryId: integer("libraryId")
    .notNull()
    .references(() => librarySchema.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export type LibraryItemSchemaType = typeof libraryItemSchema.$inferSelect;

export const libraryItemAudioFileSchema = sqliteTable("libraryItemAudioFile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  remoteId: text("ino").notNull(),
  index: integer("index").notNull(),
  duration: integer("duration").notNull(),
  progress: integer("progress"),
  complete: integer("complete", { mode: "boolean" }).default(false),
  name: text("name").notNull(),
  path: text("path"),
  libraryItemId: integer("libraryItemId").references(
    () => libraryItemSchema.id,
  ),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export type LibraryItemAudioFileSchemaType =
  typeof libraryItemAudioFileSchema.$inferSelect;

export const userSettingsSchema = sqliteTable("userSettings", {
  serverUrl: text("serverUrl").notNull(),
  tokenId: text("tokenId").notNull(),
  rate: integer("rate").notNull().default(1),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export type UserSettingsSchemaType = typeof userSettingsSchema.$inferSelect;
