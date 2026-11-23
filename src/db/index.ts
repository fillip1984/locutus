import { openDatabaseSync } from "expo-sqlite";

import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import { relations } from "@/db/relations";
import * as schema from "@/db/schema";
import migrations from "@/drizzle/migrations";

const expo = openDatabaseSync("locutus.db");
export const db = drizzle(expo, { relations });

export const dbReady = migrate(db, migrations).catch((err) => {
  console.error(
    "Exception thrown while attempting to run database migration scripts",
    err,
  );
  throw err;
});

export const dropDB = async () => {
  try {
    // console.log("dropping database");
    await db.delete(schema.librarySchema);
    // TODO: cascades don't seem to be triggering
    await db.delete(schema.libraryItemSchema);
    await db.delete(schema.audioChapterSchema);
    await db.delete(schema.ebookSchema);
    await db.delete(schema.seriesSchema);
    await db.delete(schema.libraryItemGenreSchema);
    await db.delete(schema.genreSchema);

    await db.delete(schema.userSettingsSchema);
    // console.log("dropped database");
  } catch (err) {
    console.error({ err });
    console.error("Exception thrown while attempting to drop database", err);
  }
};
