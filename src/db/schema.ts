import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const librarySchema = sqliteTable(
  "library",
  {
    id: text("id").primaryKey(),
    // id: integer("id").primaryKey({ autoIncrement: true }),
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
  // id: integer("id").primaryKey({ autoIncrement: true }),
  id: text("id").primaryKey(),
  remoteId: text("remoteId").notNull(),
  // ino: text("ino").notNull(),
  title: text("title").notNull(),
  authorName: text("authorName").notNull(),
  authorNameLF: text("authorNameLF"),
  numAudioFiles: integer("numAudioFiles").notNull(),
  ebookFileFormat: text("eBookFile"),
  duration: integer("duration").notNull(),
  publishedYear: integer("publishedYear"),
  description: text("description"),
  isbn: text("isbn"),
  asin: text("asin"),
  coverArtPath: text("coverArtPath"),
  lastPlayedId: text("lastPlayedId"),
  lastEBookId: text("lastEBookId"),
  downloaded: integer("downloaded", { mode: "boolean" }).default(false),
  complete: integer("complete", { mode: "boolean" }).default(false),
  libraryId: text("libraryId")
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
  id: text("id").primaryKey(),
  remoteId: text("ino").notNull(),
  index: integer("index").notNull(),
  duration: integer("duration").notNull(),
  start: integer("start").notNull(),
  end: integer("end").notNull(),
  progress: integer("progress"),
  complete: integer("complete", { mode: "boolean" }).default(false),
  name: text("name").notNull(),
  path: text("path"),
  libraryItemId: text("libraryItemId")
    .notNull()
    .references(() => libraryItemSchema.id),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type LibraryItemAudioFileSchemaType =
  typeof libraryItemAudioFileSchema.$inferSelect;

export const libraryItemEBookFileSchema = sqliteTable("libraryItemEBookFile", {
  id: text("id").primaryKey(),
  remoteId: text("ino").notNull(),
  currentLocation: text("currentLocation"),
  progress: integer("progress"),
  complete: integer("complete", { mode: "boolean" }).default(false),
  name: text("name").notNull(),
  path: text("path"),
  libraryItemId: text("libraryItemId")
    .notNull()
    .references(() => libraryItemSchema.id),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type LibraryItemEBookFileSchemaType =
  typeof libraryItemEBookFileSchema.$inferSelect;

// export const LibraryItemEBookRelations = relations(libraryItemEBookFileSchema, ({many})=>({libraryItemSchema => many(libraryItemSchema)}))

export const userSettingsSchema = sqliteTable("userSettings", {
  serverUrl: text("serverUrl").notNull(),
  signInWithBiometrics: integer("signInWithBiometrics", {
    mode: "boolean",
  })
    .notNull()
    .default(false),
  preferredPlaybackRate: integer("preferredPlaybackRate").notNull().default(1),
  lastServerSync: integer("lastServerSync", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export type UserSettingsSchemaType = typeof userSettingsSchema.$inferSelect;
