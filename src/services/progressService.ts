import { TrackPlayerExtraPayload } from "@/app/_layout";
import { db } from "@/db";
import {
  audioFileSchema,
  eBookFileSchema,
  libraryItemSchema,
  userSettingsSchema,
} from "@/db/schema";
import { getToken } from "@/stores/session-store";
import { and, eq, gt, isNotNull, lte } from "drizzle-orm";
import { TrackItem } from "react-native-nitro-player";
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
    console.log({ progressUpdatesFromServer });

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
      .from(audioFileSchema);
    // .findMany({
    //   columns: {
    //     libraryItemId: true,
    //     start: true,
    //     progress: true,
    //     complete: true,
    //     updatedAt: true,
    //   },
    and(
      gt(audioFileSchema.updatedAt, new Date(lastSync)),
      isNotNull(audioFileSchema.progress),
    );
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

    await db.transaction(async (tx) => {
      // update client
      console.log("updating ebooks");
      for (const ebook of progressUpdates.filter(
        (i) => i.source === "server" && i.type === "ebook",
      ) as EBookProgressUpdate[]) {
        await tx
          .update(eBookFileSchema)
          .set({
            updatedAt: new Date(ebook.updatedAt),
            currentLocation: ebook.ebookLocation,
            progress: ebook.ebookProgress,
            complete: ebook.isFinished,
          })
          .where(eq(eBookFileSchema.id, ebook.libraryItemId));
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
        const audioBookItemToUpdate = await db
          .select()
          .from(audioFileSchema)
          .where(
            and(
              eq(audioFileSchema.libraryItemId, audioBook.libraryItemId),
              lte(audioFileSchema.start, audioBook.currentTime),
              gt(audioFileSchema.end, audioBook.currentTime),
            ),
          );
        // TODO: there's a bug right here. If we ask the server for any updates on media we don't have downloaded then we get an error because we try to set the progress even though there are no files
        // if (!audioBookItemToUpdate) {
        //   throw Error(
        //     "Unable to find audio book item to update for currentTime: " +
        //       audioBook.currentTime,
        //   );
        // }
        if (audioBookItemToUpdate) {
          await tx
            .update(audioFileSchema)
            .set({
              updatedAt: new Date(audioBook.updatedAt),
              progress: audioBook.currentTime,
              complete: audioBook.isFinished,
            })
            .where(eq(audioFileSchema.id, audioBookItemToUpdate.id));
          await tx
            .update(libraryItemSchema)
            .set({
              updatedAt: new Date(audioBook.updatedAt),
              lastPlayedId: audioBookItemToUpdate?.id,
              complete: audioBook.isFinished,
            })
            .where(eq(libraryItemSchema.id, audioBook.libraryItemId));
        }
      }

      // update server
      console.log("updating server");
      const token = getToken();
      if (progressUpdates.filter((i) => i.source === "client").length > 0) {
        await fetch("/api/me/progress/batch/update", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            progressUpdates.filter((i) => i.source === "client"),
          ),
        });
      }

      // update sync time
      await tx.update(userSettingsSchema).set({ lastServerSync: new Date() });
    });
  } catch (err) {
    console.error("Exception occurred while fetching user sessions", err);
    // Toast.show({
    //   position: "bottom",
    //   type: "error",
    //   text1: "Error while attempting to retrieve user sessions",
    // });
    throw err;
  }
};

export const getProgressFromServer = async (lastSync: number) => {
  const response = await audiobookShelfFetch<Root>("/api/me");
  const serverMediaProgressItems = response.mediaProgress.filter(
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
