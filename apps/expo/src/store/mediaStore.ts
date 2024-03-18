import { desc, eq } from "drizzle-orm";

import type { PlaylistItemType } from "@acme/validators";

import { localDb } from "~/db";
import { media } from "~/db/schema";

export const create = async (mediaItem: PlaylistItemType) => {
  const result = localDb
    .insert(media)
    .values({
      title: mediaItem.title,
      link: mediaItem.link,
      video: mediaItem.video,
    })
    .returning();
  return result;
};

export const readAll = async () => {
  const results = await localDb.select().from(media).orderBy(desc(media.title));
  return results;
};

export const readOne = async (id: number) => {
  const results = await localDb.select().from(media).where(eq(media.id, id));

  if (results.length === 1) {
    return results[0];
  } else if (results.length === 0) {
    return null;
  } else if (results.length > 1) {
    throw new Error("More than 1 result found,  id should be unique");
  }
};

export const del = async (id: number) => {
  const result = await localDb
    .delete(media)
    .where(eq(media.id, id))
    .returning({ id: media.id });
  return result;
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
