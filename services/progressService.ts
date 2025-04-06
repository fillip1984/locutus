import { and, eq, gt, isNotNull } from "drizzle-orm";
import Toast from "react-native-toast-message";

import { ping } from "./pingApi";

import { localDb } from "@/db";
import {
  libraryItemAudioFileSchema,
  libraryItemEBookFileSchema,
  libraryItemSchema,
  userSettingsSchema,
} from "@/db/schema";
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

    const progressUpdatesFromServer = await getProgressFromServer(
      userSettings.serverUrl,
      lastSync,
    );
    console.log({ progressUpdatesFromServer });

    const ebookProgressFromPhone =
      await localDb.query.libraryItemEBookFileSchema.findMany({
        where: and(
          gt(libraryItemEBookFileSchema.updatedAt, new Date(lastSync)),
          isNotNull(libraryItemEBookFileSchema.currentLocation),
        ),
      });
    const ebookProgressUpdates: EBookProgressUpdate[] =
      ebookProgressFromPhone.map((ebook) => {
        return {
          libraryItemId: ebook.libraryItemId,
          // TODO: figure out how to get drizzle where clauses to shape data
          ebookLocation: ebook.currentLocation
            ? ebook.currentLocation
            : "unknown",
          // TODO: figure out how to get drizzle where clauses to shape data
          ebookProgress: ebook.progress ? ebook.progress : -1,
          updatedAt: ebook.updatedAt.getTime(),
          type: "ebook",
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
    const audioBookProgressUpdates: AudioBookProgressUpdate[] =
      audioBookProgressFromPhone.map((audioBook) => {
        return {
          libraryItemId: audioBook.libraryItemId,
          // duration: 83110.977724, //doesn't appear to be necessary
          // TODO: figure out how to signal that item is complete
          // isFinished: audioBook.complete,
          // TODO: figure out how to get drizzle where clauses to shape data
          currentTime:
            audioBook.start + (audioBook.progress ? audioBook.progress : 0),
          updatedAt: audioBook.updatedAt.getTime(),
          type: "audioBook",
          source: "client",
        };
      });

    const progressUpdates: (EBookProgressUpdate | AudioBookProgressUpdate)[] = [
      ...ebookProgressUpdates,
      ...audioBookProgressUpdates,
      ...progressUpdatesFromServer,
    ].reduce(
      (
        acc: (EBookProgressUpdate | AudioBookProgressUpdate)[],
        obj: EBookProgressUpdate | AudioBookProgressUpdate,
      ) => {
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
      },
      [],
    );

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
      console.log("updating ebooks");
      for (const ebook of progressUpdates.filter(
        (i) => i.source === "server" && i.type === "ebook",
      ) as EBookProgressUpdate[]) {
        await tx
          .update(libraryItemEBookFileSchema)
          .set({
            updatedAt: new Date(ebook.updatedAt),
            currentLocation: ebook.ebookLocation,
            progress: ebook.ebookProgress,
            complete: ebook.isFinished,
          })
          .where(eq(libraryItemEBookFileSchema.id, ebook.libraryItemId));
        await tx
          .update(libraryItemSchema)
          .set({
            updatedAt: new Date(ebook.updatedAt),
            lastEBookId: ebook.libraryItemId,
            complete: ebook.isFinished,
          })
          .where(eq(libraryItemSchema.id, ebook.libraryItemId));
      }

      console.log("updating audiobooks");
      for (const audioBook of progressUpdates.filter(
        (i) => i.source === "server" && i.type === "audioBook",
      ) as AudioBookProgressUpdate[]) {
        console.log(`updating audiobook ${audioBook.libraryItemId}`);
        const audioBookItemToUpdate =
          await localDb.query.libraryItemAudioFileSchema.findFirst({
            where: and(
              eq(
                libraryItemAudioFileSchema.libraryItemId,
                audioBook.libraryItemId,
              ),
              //lte(libraryItemAudioFileSchema.start, audioBook.currentTime),
              //gte(libraryItemAudioFileSchema.end, audioBook.currentTime),
            ),
          });
        if (!audioBookItemToUpdate) {
          throw Error(
            "Unable to find audio book item to update for currentTime: " +
              audioBook.currentTime,
          );
        }
        await tx
          .update(libraryItemAudioFileSchema)
          .set({
            updatedAt: new Date(audioBook.updatedAt),
            progress: audioBook.currentTime,
            complete: audioBook.isFinished,
          })
          .where(eq(libraryItemAudioFileSchema.id, audioBookItemToUpdate.id));
        await tx
          .update(libraryItemSchema)
          .set({
            updatedAt: new Date(audioBook.updatedAt),
            lastPlayedId: audioBookItemToUpdate?.id,
            complete: audioBook.isFinished,
          })
          .where(eq(libraryItemSchema.id, audioBook.libraryItemId));
      }

      // update server
      console.log("updating server");
      if (progressUpdates.filter((i) => i.source === "client").length > 0) {
        await (
          await getAxiosClient()
        ).patch(
          `${userSettings.serverUrl}/api/me/progress/batch/update`,
          progressUpdates.filter((i) => i.source === "client"),
        );
      }

      // update sync time
      await tx.update(userSettingsSchema).set({ lastServerSync: new Date() });
    });
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

export const getProgressFromServer = async (
  serverUrl: string,
  lastSync: number,
) => {
  const response = (await getAxiosClient()).get<Root>(`${serverUrl}/api/me`);
  const serverMediaProgressItems = (await response).data.mediaProgress.filter(
    (media) => media.lastUpdate > lastSync,
  );
  const results: (EBookProgressUpdate | AudioBookProgressUpdate)[] = [];

  for (const serverMedia of serverMediaProgressItems) {
    //       // TODO: figure out how to signal that item is complete
    //       isFinished: media.isFinished,
    if (serverMedia.currentTime) {
      results.push({
        libraryItemId: serverMedia.libraryItemId,
        currentTime: serverMedia.currentTime,
        updatedAt: serverMedia.lastUpdate,
        isFinished: serverMedia.isFinished,
        type: "audioBook",
        source: "server",
      } as AudioBookProgressUpdate);
    }

    if (serverMedia.ebookLocation) {
      results.push({
        libraryItemId: serverMedia.libraryItemId,
        ebookLocation: serverMedia.ebookLocation,
        ebookProgress: serverMedia.ebookProgress,
        updatedAt: serverMedia.lastUpdate,
        isFinished: serverMedia.isFinished,
        type: "ebook",
        source: "server",
      } as EBookProgressUpdate);
    }
  }
  return results;
};

interface MediaProgressUpdate {
  libraryItemId: string;
  isFinished?: boolean;
  updatedAt: number;
  type: "ebook" | "audioBook";
  source: "client" | "server";
}

interface EBookProgressUpdate extends MediaProgressUpdate {
  ebookLocation: string;
  ebookProgress: number;
}

interface AudioBookProgressUpdate extends MediaProgressUpdate {
  // duration: number | null;
  currentTime: number;
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
