import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite/next";

import * as schema from "./schema";
import migrations from "../drizzle/migrations";

export const localDb = drizzle(openDatabaseSync("locutus.db"), { schema });

const runMigrations = async () => {
  try {
    console.log("running migration");
    await migrate(localDb, migrations);
    console.log("ran migration");
  } catch (err) {
    console.error({ err });
    console.error(
      "Exception thrown while attempting to run database migration scripts",
      err,
    );
  }
};

runMigrations();

// TODO: opening a second connection didn't work, prepared statements didn't recover even after rebuilding
export const dropDatabase = async () => {
  try {
    console.log("dropping data");
    const db = openDatabaseSync("locutus.db");
    db.execSync("DROP TABLE IF EXISTS libraryItemAudioFile;");
    db.execSync("DROP TABLE IF EXISTS libraryItem;");
    db.execSync("DROP TABLE IF EXISTS library;");
    console.log("dropped data");
    runMigrations();
  } catch (err) {
    console.error("Exception occurred while dropping data", err);
    throw err;
  }
};
