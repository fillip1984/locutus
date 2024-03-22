import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const library = sqliteTable("library", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export type LibraryType = typeof library.$inferSelect;

export const libraryItem = sqliteTable("libraryItem", {
  id: text("id").primaryKey(),
  ino: text("ino").notNull(),
  title: text("title").notNull(),
  authorName: text("authorName").notNull(),
  numAudioFiles: integer("numAudioFiles").notNull(),
  duration: integer("duration").notNull(),
  libraryId: text("libraryId").references(() => library.id),
});

export const libraryItemAudioFile = sqliteTable("libraryItemAudioFile", {
  id: text("id").primaryKey(),
  index: integer("index").notNull(),
  duration: integer("duration").notNull(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  libraryItemId: text("libraryItemId").references(() => libraryItem.id),
});
