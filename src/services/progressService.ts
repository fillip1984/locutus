import { TrackItem } from "react-native-nitro-player";

import { and, eq, gt, isNotNull } from "drizzle-orm";

import { TrackPlayerExtraPayload } from "@/app/_layout";
import { db } from "@/db";
import {
  audioFileSchema,
  eBookFileSchema,
  libraryItemSchema,
  userSettingsSchema,
} from "@/db/schema";
import { getToken } from "@/stores/session-store";
import { audiobookShelfFetch } from "./audiobookShelfBaseClient";
import { pingBackend } from "./pingApi";

export const recordProgress = async (
  currentTrack: TrackItem,
  currentPosition: number,
) => {
  const audioFileId = (currentTrack.extraPayload as TrackPlayerExtraPayload)
    .audioFileId;
  const libraryItemId = (currentTrack.extraPayload as TrackPlayerExtraPayload)
    .libraryItemId;

  // console.log(
  //   `recording progress for track ${audioFileId} at position ${currentPosition}`,
  // );

  void db
    .update(audioFileSchema)
    .set({
      progress: currentPosition,
      updatedAt: new Date(),
      complete: false,
    })
    .where(eq(audioFileSchema.id, audioFileId))
    .run();

  void db
    .update(libraryItemSchema)
    .set({
      lastPlayedId: audioFileId,
      updatedAt: new Date(),
    })
    .where(eq(libraryItemSchema.id, libraryItemId))
    .run();
};

export const markComplete = async ({
  track,
  duration,
}: {
  track: string;
  duration: number;
}) => {
  const audioFileId = track;
  console.log(`mark complete audio file: ${audioFileId}`);
  void db
    .update(audioFileSchema)
    .set({
      progress: duration,
      complete: true,
      updatedAt: new Date(),
    })
    .where(eq(audioFileSchema.id, audioFileId))
    .run();

  // TODO: update the library item as complete as well if this was the last file
};

// export const isAudioFileNearEnd = (
//   currentPosition: number,
//   duration: number,
// ) => {
//   // TODO: consider it near the end if within the last 1 minutes or 5% remaining of the total duration, whichever is less
//   // const timeThreshold = Math.min(60, duration * 0.05);
//   const timeThreshold = 60;
//   const nearEnd = currentPosition >= duration - timeThreshold;
//   console.log(
//     `is audio file near end? currentPosition: ${currentPosition}, duration: ${duration}, timeThreshold: ${timeThreshold}, nearEnd: ${nearEnd}`,
//   );
//   return nearEnd;
// };

export const syncProgressWithServer = async () => {
  const userSettings = await db.query.userSettingsSchema.findFirst();

  if (!userSettings) {
    throw Error("unable to sync with server, was not able to find server url");
  }

  try {
    const pingResponse = await pingBackend();
    if (!pingResponse) {
      console.log("not connected to server");
      return;
    }

    const lastSync = userSettings?.lastServerSync?.getTime() ?? 0;

    const progressUpdatesFromServer = await getProgressFromServer(lastSync);

    const ebookProgressFromPhone = await db
      .select()
      .from(eBookFileSchema)
      .where(
        and(
          gt(eBookFileSchema.updatedAt, new Date(lastSync)),
          isNotNull(eBookFileSchema.currentLocation),
        ),
      );
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
          updatedAt: ebook.updatedAt?.getTime() ?? 0,
          type: "ebook",
          source: "client",
          // TODO: figure out how to signal that item is complete
          // isFinished: audioBook.complete,
        };
      });

    const audioBookProgressFromPhone = await db
      .select({
        libraryItemId: audioFileSchema.libraryItemId,
        start: audioFileSchema.start,
        progress: audioFileSchema.progress,
        complete: audioFileSchema.complete,
        updatedAt: audioFileSchema.updatedAt,
      })
      .from(audioFileSchema)
      .where(
        and(
          gt(audioFileSchema.updatedAt, new Date(lastSync)),
          gt(audioFileSchema.progress, 0),
        ),
      );
    const audioBookProgressUpdates: AudioBookProgressUpdate[] =
      audioBookProgressFromPhone.map((audioBook) => {
        console.log(
          `found audiobook progress update for library item ${audioBook.libraryItemId}, start: ${audioBook.start}, progress: ${audioBook.progress}, complete: ${audioBook.complete}, updatedAt: ${audioBook.updatedAt}`,
        );
        return {
          libraryItemId: audioBook.libraryItemId,
          // duration: 83110.977724, //doesn't appear to be necessary
          // TODO: figure out how to signal that item is complete
          // isFinished: audioBook.complete,
          // TODO: figure out how to get drizzle where clauses to shape data
          currentTime:
            audioBook.start + (audioBook.progress ? audioBook.progress : 0),
          updatedAt: audioBook.updatedAt?.getTime() ?? 0,
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

    // TODO: doesn't appear expo sqlite supports transactions... add back later

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

    console.log("updating ebooks");
    for (const ebook of progressUpdates.filter(
      (i) => i.source === "server" && i.type === "ebook",
    ) as EBookProgressUpdate[]) {
      const existingEBookFile = await db.query.eBookFileSchema.findFirst({
        where: {
          libraryItemId: ebook.libraryItemId,
        },
        columns: {
          id: true,
          libraryItemId: true,
        },
      });

      if (!existingEBookFile) {
        console.warn(
          `could not find any ebook files for library item ${ebook.libraryItemId}, skipping progress update from server`,
        );
        continue;
      }

      console.log(
        `updating progress for library item ${ebook.libraryItemId} to position ${ebook.ebookLocation} based on server update`,
      );
      void db
        .update(eBookFileSchema)
        .set({
          currentLocation: ebook.ebookLocation,
          progress: ebook.ebookProgress,
          updatedAt: new Date(ebook.updatedAt),
          complete: ebook.isFinished,
        })
        .where(eq(eBookFileSchema.id, existingEBookFile.id))
        .run();
      db.update(libraryItemSchema)
        .set({
          updatedAt: new Date(ebook.updatedAt),
          lastPlayedId: existingEBookFile.id,
          complete: ebook.isFinished,
        })
        .where(eq(libraryItemSchema.id, ebook.libraryItemId))
        .run();
    }

    for (const audioBook of progressUpdates.filter(
      (i) => i.source === "server" && i.type === "audioBook",
    ) as AudioBookProgressUpdate[]) {
      const existingAudioFiles = await db.query.audioFileSchema.findFirst({
        where: {
          libraryItemId: audioBook.libraryItemId,
          start: {
            lte: audioBook.currentTime,
          },
          end: {
            gte: audioBook.currentTime,
          },
        },
        columns: {
          id: true,
          libraryItemId: true,
        },
      });

      if (!existingAudioFiles) {
        console.warn(
          `could not find any audio files for library item ${audioBook.libraryItemId}, skipping progress update from server`,
        );
        continue;
      }

      console.log(
        `updating progress for library item ${audioBook.libraryItemId} to position ${audioBook.currentTime} based on server update`,
      );
      void db
        .update(audioFileSchema)
        .set({
          progress: audioBook.currentTime,
          updatedAt: new Date(audioBook.updatedAt),
          complete: audioBook.isFinished,
        })
        .where(eq(audioFileSchema.id, existingAudioFiles.id))
        .run();
      db.update(libraryItemSchema)
        .set({
          updatedAt: new Date(audioBook.updatedAt),
          lastPlayedId: existingAudioFiles.id,
          complete: audioBook.isFinished,
        })
        .where(eq(libraryItemSchema.id, audioBook.libraryItemId))
        .run();
    }

    console.log(
      "updating server",
      JSON.stringify(progressUpdates.filter((i) => i.source === "client")),
    );

    const token = await getToken();
    if (progressUpdates.filter((i) => i.source === "client").length > 0) {
      const result = await fetch(
        `${userSettings.serverUrl}/api/me/progress/batch/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            progressUpdates.filter((i) => i.source === "client"),
          ),
        },
      );

      if (!result.ok) {
        console.error(
          "Failed to update progress to server, status: " + result.status,
        );
      } else {
        console.log(
          "successfully updated progress to server",
          await result.text(),
        );
      }
    }

    console.log("updating sync time");
    db.update(userSettingsSchema).set({ lastServerSync: new Date() }).run();
  } catch (err) {
    console.error("Exception occurred while fetching user sessions", err);
    throw err;
  }
};

export const getProgressFromServer = async (lastSync: number) => {
  console.log(
    `fetching progress updates from server since ${new Date(lastSync)}`,
  );
  const response = await audiobookShelfFetch<Root>("/api/me");
  const serverMediaProgressItems =
    response?.mediaProgress.filter((media) => media.lastUpdate > lastSync) ??
    [];
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
  console.log("Found " + results.length + " progress items from server");
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
