import { and, gt, isNotNull, ne } from "drizzle-orm";
import Toast from "react-native-toast-message";

import { Media } from "./libraryItemApi";
import { ping } from "./pingApi";

import { localDb } from "@/db";
import {
  libraryItemAudioFileSchema,
  libraryItemEBookFileSchema,
} from "@/db/schema";
import { getToken } from "@/stores/sessionStore";
import { getAxiosClient } from "@/utils/axiosClient";

export const syncProgressWithServer = async () => {
  const userSettings = await localDb.query.userSettingsSchema.findFirst();
  if (!userSettings) {
    throw Error("unable to sync with server, was not able to find server url");
  }

  try {
    const pingResponse = await ping(userSettings.serverUrl);
    console.log(pingResponse);
    if (!pingResponse) {
      console.log("not connected to server");
      return;
    }

    const lastSync = userSettings?.lastServerSync?.getTime() ?? 0;

    const response = (await getAxiosClient()).get<Root>(
      `${userSettings.serverUrl}/api/me`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
    );

    const mediaProgressFromServer = (await response).data.mediaProgress
      .filter((media) => media.lastUpdate > lastSync)
      .map((media) => {
        return {
          libraryItemId: media.libraryItemId,
          ebookLocation: media.ebookLocation,
          ebookProgress: media.ebookProgress,
          currentTime: media.currentTime,
          progress: media.progress,
          finished: media.isFinished,
        };
      });

    // for (const media of mediaProgressFromServer) {
    //   // const lastUpdate = new Date(item.lastUpdate);
    //   // console.log({ loc: item.ebookLocation, lastUpdate });
    //   console.log({ media });
    // }

    const ebookProgressFromPhone =
      await localDb.query.libraryItemEBookFileSchema.findMany({
        where: and(
          gt(libraryItemEBookFileSchema.updatedAt, new Date(lastSync)),
          isNotNull(libraryItemEBookFileSchema.currentLocation),
        ),
        with: {},
      });
    // ebookProgressFromPhone.forEach((ebook) => console.log({ ebook }));
    const ebookProgressUpdates: MediaProgressUpdate[] =
      ebookProgressFromPhone.map((ebook) => {
        return {
          libraryItemId: ebook.remoteId,
          ebookLocation: ebook.currentLocation,
          ebookProgress: ebook.progress,
        };
      });

    const audioBookProgressFromPhone =
      await localDb.query.libraryItemAudioFileSchema.findMany({
        where: and(
          gt(libraryItemAudioFileSchema.updatedAt, new Date(lastSync)),
          isNotNull(libraryItemAudioFileSchema.progress),
        ),
      });
    // audioBookProgressFromPhone.forEach((audioBook) =>
    //   console.log({ audioBook }),
    // );
    const audioBookProgressUpdates: MediaProgressUpdate[] = [];
    // audioBookProgressFromPhone.map((audioBook) => {
    //   return {
    //     libraryItemId: audioBook.remoteId,
    //     duration: audioBook.duration,
    //     currentTime: audioBook.progress,
    //   };
    // });

    interface MediaProgressUpdate {
      libraryItemId: string;
      ebookLocation?: string | null;
      ebookProgress?: number | null;
      duration?: number | null;
      currentTime?: number | null;
    }

    const updateResponse = await (
      await getAxiosClient()
    ).patch(
      `${userSettings.serverUrl}/api/me/progress/batch`,
      ebookProgressUpdates.concat(audioBookProgressUpdates),
      // // anyone else aboard sentence
      // {
      //   ebookLocation: "epubcfi(/6/24!/4/4/2/1:0)",
      //   ebookProgress: 0.085039171089209,
      // },
      // the form of the areas sentence
      // {
      //   ebookLocation: "epubcfi(/6/22!/4/94/1:90)",
      //   ebookProgress: 0.06141015921152388,
      // },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
    );
    console.log({ updateResponse });
  } catch (err) {
    console.error("Exception occurred while fetching user sessions", err);
    Toast.show({
      position: "bottom",
      type: "error",
      text1: "Error while attempting to retrieve user sessions",
    });
    throw err;
  }
};

export interface Root {
  id: string;
  username: string;
  mediaProgress: MediaProgress[];
  lastSeen: number;
}

export interface MediaProgress {
  id: string;
  userId: string;
  libraryItemId: string;
  episodeId: number;
  mediaItemId: string;
  mediaItemType: string;
  duration: number;
  progress: number;
  currentTime: number;
  isFinished: boolean;
  hideFromContinueListening: boolean;
  ebookLocation?: string;
  ebookProgress: number;
  lastUpdate: number;
  startedAt: number;
  finishedAt: any;
}
