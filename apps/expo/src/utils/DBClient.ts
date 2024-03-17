import { desc, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import type { PlaylistItemType } from "@acme/validators";

import { db } from "~/db";
import { media } from "~/db/schema";
import migrations from "../../drizzle/migrations";

export const testDB = async () => {
  try {
    console.log("running migrations");
    await migrate(db, migrations);
    console.log("ran migrations");
  } catch (e) {
    console.log("Exception occurred while running migrations", e);
    throw e;
  }

  try {
    const all = await readAll();
    console.log({ all });
    const created = await create({
      title: "Test",
      link: "someplace",
      video: false,
    } as PlaylistItemType);
    console.log({ created });
    if (created.length >= 1 && created[0]) {
      const id = created[0].id;
      console.log("readOne", readOne(id));
      console.log("del", del(id));
      const finalAll = await readAll();
      console.log({ finalAll });
    }
  } catch (e) {
    console.error("Exception occurred while testin db", e);
    throw e;
  }

  if ((await readAll()).length <= 3) {
    loadSampleData();
  }
};

export const loadSampleData = () => {
  console.log("loading sample data");
  const playlist: PlaylistItemType[] = [
    {
      title: "Comfort Fit - 'Sorry'",
      link: "https://s3.amazonaws.com/exp-us-standard/audio/playlist-example/Comfort_Fit_-_03_-_Sorry.mp3",
      video: false,
    },
    {
      title: "Big Buck Bunny",
      link: "http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
      video: true,
    },
    {
      title: "Mildred Bailey – “All Of Me”",
      link: "https://ia800304.us.archive.org/34/items/PaulWhitemanwithMildredBailey/PaulWhitemanwithMildredBailey-AllofMe.mp3",
      video: false,
    },

    {
      title: "Popeye - I don't scare",
      link: "https://ia800501.us.archive.org/11/items/popeye_i_dont_scare/popeye_i_dont_scare_512kb.mp4",
      video: true,
    },

    {
      title: "Podington Bear - “Rubber Robot”",
      link: "https://s3.amazonaws.com/exp-us-standard/audio/playlist-example/Podington_Bear_-_Rubber_Robot.mp3",
      video: false,
    },
    {
      title: "Ray Charles - I can't stop loving you",
      link: "https://ia801302.us.archive.org/19/items/ICantStopLovingYou/07.ICantStopLovingYou1.mp3",
      video: false,
    },
  ];

  playlist.forEach((item) => {
    void create(item);
  });
  console.log("loading sample data");
};

export const create = async (mediaItem: PlaylistItemType) => {
  const result = db
    .insert(media)
    .values({
      title: mediaItem.title,
      link: mediaItem.link,
      video: mediaItem.video,
    })
    .returning();
  return result;
  //   try {
  //     const result = await db.runAsync(
  //       `INSERT INTO media (title, link, video) VALUES (?,?,?)`,
  //       media.title,
  //       media.link,
  //       media.video ? "TRUE" : "FALSE",
  //     );
  //     console.log(result);
  //   } catch (e) {
  //     console.error("error on create", e);
  //   }
  // db.transaction(
  //   (tx) => {
  //     tx.executeSql("insert into media (title, link, video) values (?,?,?)", [
  //       media.title,
  //       media.link,
  //       media.video ? "TRUE" : "FALSE",
  //     ]);
  //   },
  //   (e) => {
  //     console.log("error on create", e);
  //   },
  //   () => {
  //     console.log("success on create");
  //   },
  // );
};

export const readAll = async () => {
  const results = await db.select().from(media).orderBy(desc(media.title));
  return results;
  //   try {
  //     const result = await db.getAllAsync("SELECT * from media");
  //     console.log(result);
  //   } catch (e) {
  //     console.error("error on readAll", e);
  //   }
  // db.transaction(
  //   (tx) => {
  //     tx.executeSql("select * from media");
  //   },
  //   () => {
  //     console.log("error on readAll");
  //   },
  //   () => {
  //     console.log("success on readAll");
  //   },
  // );
};

export const readOne = (id: number) => {
  const results = db.select().from(media).where(eq(media.id, id)).run();
  return results;
  //   try {
  //     const result = await db.getFirstAsync(
  //       "SELECT * from media where id = (?)",
  //       id,
  //     );
  //     console.log(result);
  //   } catch (e) {
  //     console.error("error on readOne", e);
  //   }
  // db.transaction(
  //   (tx) => {
  //     tx.executeSql("select * from media where id = (?)", [id]);
  //   },
  //   () => {
  //     console.log("error on readOne");
  //   },
  //   () => {
  //     console.log("success on readOne");
  //   },
  // );
};

export const del = (id: number) => {
  const result = db.delete(media).where(eq(media.id, id)).run();
  return result;
  //   try {
  //     const result = await db.runAsync("DELETE FROM media WHERE id = $id", {
  //       $id: id,
  //     });
  //     console.log(result);
  //   } catch (e) {
  //     console.error("error on del", e);
  //   }
  // db.transaction(
  //   (tx) => {
  //     tx.executeSql("delete from media where id = (?)", [id]);
  //   },
  //   () => {
  //     console.log("error on del");
  //   },
  //   () => {
  //     console.log("success on del");
  //   },
  // );
};
