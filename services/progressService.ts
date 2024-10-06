import { and, eq, gt, isNotNull } from "drizzle-orm";
import Toast from "react-native-toast-message";

import { ping } from "./pingApi";

import { localDb } from "@/db";
import {
  libraryItemAudioFileSchema,
  libraryItemEBookFileSchema,
  userSettingsSchema,
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

    const progressUpdatesFromServer = (await response).data.mediaProgress
      .filter((media) => media.lastUpdate > lastSync)
      .map((media) => {
        return {
          libraryItemId: media.libraryItemId,
          ebookLocation: media.ebookLocation,
          ebookProgress: media.ebookProgress,
          currentTime: media.currentTime,
          // TODO: figure out how to signal that item is complete
          isFinished: media.isFinished,
          updatedAt: media.lastUpdate,
          source: "server",
        } as MediaProgressUpdate;
      });

    // console.log({ progressUpdatesFromServer });

    const ebookProgressFromPhone =
      await localDb.query.libraryItemEBookFileSchema.findMany({
        where: and(
          gt(libraryItemEBookFileSchema.updatedAt, new Date(lastSync)),
          isNotNull(libraryItemEBookFileSchema.currentLocation),
        ),
      });
    const ebookProgressUpdates: MediaProgressUpdate[] =
      ebookProgressFromPhone.map((ebook) => {
        return {
          libraryItemId: ebook.libraryItemId,
          ebookLocation: ebook.currentLocation,
          ebookProgress: ebook.progress,
          updatedAt: ebook.updatedAt.getTime(),
          source: "client",
          // TODO: figure out how to signal that item is complete
          // isFinished: audioBook.complete,
        };
      });

    const audioBookProgressFromPhone =
      await localDb.query.libraryItemAudioFileSchema.findMany({
        columns: {
          libraryItemId: true,
          start: true,
          progress: true,
          complete: true,
          updatedAt: true,
        },
        where: and(
          gt(libraryItemAudioFileSchema.updatedAt, new Date(lastSync)),
          isNotNull(libraryItemAudioFileSchema.progress),
        ),
      });
    const audioBookProgressUpdates: MediaProgressUpdate[] =
      audioBookProgressFromPhone.map((audioBook) => {
        return {
          libraryItemId: audioBook.libraryItemId,
          // duration: 83110.977724, //doesn't appear to be necessary
          // TODO: figure out how to signal that item is complete
          // isFinished: audioBook.complete,
          currentTime: audioBook.progress
            ? audioBook.start + audioBook.progress
            : null,
          updatedAt: audioBook.updatedAt.getTime(),
          source: "client",
        };
      });

    const progressUpdates: MediaProgressUpdate[] = [
      ...ebookProgressUpdates,
      ...audioBookProgressUpdates,
      ...progressUpdatesFromServer,
    ].reduce((acc: MediaProgressUpdate[], obj: MediaProgressUpdate) => {
      const existingIndex = acc.findIndex(
        (item) => item.libraryItemId === obj.libraryItemId,
      );

      if (existingIndex === -1) {
        acc.push(obj);
      } else {
        const existingDate = new Date(acc[existingIndex].updatedAt);
        const newDate = new Date(obj.updatedAt);

        if (newDate > existingDate) {
          acc[existingIndex] = obj;
        }
      }

      return acc;
    }, []);

    console.log({
      msg: "Updates from server",
      length: progressUpdates.filter((i) => i.source === "server").length,
    });
    console.log({
      msg: "Updates from client",
      length: progressUpdates.filter((i) => i.source === "client").length,
    });
    if (progressUpdates.length === 0) {
      console.log("no updates to make to sync progress with server");
    }

    await localDb.transaction(async (tx) => {
      // update client
      for (const ebook of progressUpdates.filter(
        (i) => i.source === "server",
      )) {
        await tx
          .update(libraryItemEBookFileSchema)
          .set({
            updatedAt: new Date(ebook.updatedAt),
            currentLocation: ebook.ebookLocation,
            progress: ebook.ebookProgress,
          })
          .where(
            eq(libraryItemEBookFileSchema.libraryItemId, ebook.libraryItemId),
          );
      }

      for (const audioBook of progressUpdates.filter(
        (i) => i.source === "server",
      )) {
        await tx.update(libraryItemAudioFileSchema).set({
          updatedAt: new Date(audioBook.updatedAt),
          progress: audioBook.currentTime,
        });
      }

      // update server
      if (progressUpdates.filter((i) => i.source === "client").length > 0) {
        const updateResponse = await (
          await getAxiosClient()
        ).patch(
          `${userSettings.serverUrl}/api/me/progress/batch/update`,
          progressUpdates.filter((i) => i.source === "client"),
        );
      }

      // update sync time
      await tx.update(userSettingsSchema).set({ lastServerSync: new Date() });
    });
    // await localDb
    //   .update(userSettingsSchema)
    //   .set({ lastServerSync: new Date() });
    // console.log({ msg: "Server sync status", status: updateResponse.status });
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

interface MediaProgressUpdate {
  libraryItemId: string;
  ebookLocation?: string | null;
  ebookProgress?: number | null;
  duration?: number | null;
  currentTime?: number | null;
  isFinished?: boolean;
  updatedAt: number;
  source: "client" | "server";
}

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
