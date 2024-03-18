import { openDatabaseSync } from "expo-sqlite/next";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import migrations from "../../drizzle/migrations";

export const localDb = drizzle(openDatabaseSync("locutus.db"));

// TODO: figure out if there's an offical way to do this, would like to make connection, test connection, and then run migrations
const runMigrations = async () => {
  console.log("running migration");
  await migrate(localDb, migrations);
  console.log("ran migration");
};

void runMigrations();

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

// export const loadSampleData = () => {
//   console.log("loading sample data");
//   const playlist: PlaylistItemType[] = [
//     {
//       title: "Comfort Fit - 'Sorry'",
//       link: "https://s3.amazonaws.com/exp-us-standard/audio/playlist-example/Comfort_Fit_-_03_-_Sorry.mp3",
//       video: false,
//     },
//     {
//       title: "Big Buck Bunny",
//       link: "http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
//       video: true,
//     },
//     {
//       title: "Mildred Bailey – “All Of Me”",
//       link: "https://ia800304.us.archive.org/34/items/PaulWhitemanwithMildredBailey/PaulWhitemanwithMildredBailey-AllofMe.mp3",
//       video: false,
//     },

//     {
//       title: "Popeye - I don't scare",
//       link: "https://ia800501.us.archive.org/11/items/popeye_i_dont_scare/popeye_i_dont_scare_512kb.mp4",
//       video: true,
//     },

//     {
//       title: "Podington Bear - “Rubber Robot”",
//       link: "https://s3.amazonaws.com/exp-us-standard/audio/playlist-example/Podington_Bear_-_Rubber_Robot.mp3",
//       video: false,
//     },
//     {
//       title: "Ray Charles - I can't stop loving you",
//       link: "https://ia801302.us.archive.org/19/items/ICantStopLovingYou/07.ICantStopLovingYou1.mp3",
//       video: false,
//     },
//   ];

//   playlist.forEach((item) => {
//     void create(item);
//   });
//   console.log("loading sample data");
// };
