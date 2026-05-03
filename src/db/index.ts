import { openDatabaseSync } from "expo-sqlite";

import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import { relations } from "@/db/relations";
import * as schema from "@/db/schema";
import migrations from "@/drizzle/migrations";

const expo = openDatabaseSync("locutus.db");
export const db = drizzle(expo, { schema, relations });

const runMigrations = async () => {
  try {
    // console.log("running migration");
    await migrate(db, migrations);
    // console.log("ran migration");
  } catch (err) {
    console.error({ err });
    console.error(
      "Exception thrown while attempting to run database migration scripts",
      err,
    );
  }
};

export const dropDB = async () => {
  try {
    // console.log("dropping database");
    await db.delete(schema.librarySchema);
    // TODO: cascades don't seem to be triggering
    await db.delete(schema.libraryItemSchema);
    await db.delete(schema.audioFileSchema);
    await db.delete(schema.eBookFileSchema);

    await db.delete(schema.userSettingsSchema);
    // console.log("dropped database");
  } catch (err) {
    console.error({ err });
    console.error("Exception thrown while attempting to drop database", err);
  }
};

runMigrations();

// export const testDatabaseConnection = async () => {
//   try {
//     const result = await db.getFirstAsync<{ ok: number }>("SELECT 1 AS ok");
//     const tableResult = await sqlite.getFirstAsync<{ name: string }>(
//       "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'userSettings'",
//     );
//     const isConnected = result?.ok === 1;
//     const isSetup = tableResult?.name === "userSettings";

//     if (isConnected && isSetup) {
//       console.log("database connection test passed and setup verified");
//     } else {
//       console.error(
//         "database connection test failed: setup verification did not pass",
//       );
//     }

//     return isConnected && isSetup;
//   } catch (err) {
//     console.error("database connection test failed", err);
//     return false;
//   }
// };

// await runMigrations();
// await testDatabaseConnection();
