import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const media = sqliteTable("media", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  link: text("link").notNull(),
  video: integer("video", { mode: "boolean" }).notNull().default(false),
});

//export type SelectMedia = typeof media.$inferSelect;
//export type InsertMedia = typeof media.$inferInsert;
