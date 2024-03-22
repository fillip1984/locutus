import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite/next";

import migrations from "../drizzle/migrations";

export const localDb = drizzle(openDatabaseSync("locutus.db"));

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
