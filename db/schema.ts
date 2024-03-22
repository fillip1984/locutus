import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const librarySchema = sqliteTable("library", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export type LibrarySchemaType = typeof librarySchema.$inferSelect;

export const libraryItemSchema = sqliteTable("libraryItem", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // ino: text("ino").notNull(),
  title: text("title").notNull(),
  authorName: text("authorName").notNull(),
  numAudioFiles: integer("numAudioFiles").notNull(),
  duration: integer("duration").notNull(),
  libraryId: integer("libraryId")
    .notNull()
    .references(() => librarySchema.id),
});

// export const libraryItemAudioFile = sqliteTable("libraryItemAudioFile", {
// id: integer("id").primaryKey({ autoIncrement: true }),
//   index: integer("index").notNull(),
//   duration: integer("duration").notNull(),
//   name: text("name").notNull(),
//   path: text("path").notNull(),
//   libraryItemId: integer("libraryItemId").references(() => libraryItem.id),
// });
