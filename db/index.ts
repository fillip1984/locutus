import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite/next";

import migrations from "../drizzle/migrations";

export const localDb = drizzle(openDatabaseSync("locutus.db"));

// TODO: figure out if there's an offical way to do this, would like to make connection, test connection, and then run migrations
const runMigrations = async () => {
  console.log("running migration");
  await migrate(localDb, migrations);
  console.log("ran migration");
};

runMigrations();

// export const testDB = async () => {
//   try {
//     console.log("running migrations");
//     await migrate(db, migrations);
//     console.log("ran migrations");
//   } catch (e) {
//     console.log("Exception occurred while running migrations", e);
//     throw e;
//   }

//   try {
//     const all = await readAll();
//     console.log({ all });
//     const created = await create({
//       title: "Test",
//       link: "someplace",
//       video: false,
//     } as PlaylistItemType);
//     console.log({ created });
//     if (created.length >= 1 && created[0]) {
//       const id = created[0].id;
//       console.log("readOne", readOne(id));
//       console.log("del", del(id));
//       const finalAll = await readAll();
//       console.log({ finalAll });
//     }
//   } catch (e) {
//     console.error("Exception occurred while testin db", e);
//     throw e;
//   }

//   if ((await readAll()).length <= 3) {
//     loadSampleData();
//   }
// };
