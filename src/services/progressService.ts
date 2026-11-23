import { TrackItem } from "react-native-nitro-player";

import { and, eq, gt, or, sql } from "drizzle-orm";

import { TrackPlayerExtraPayload } from "@/app/_layout";
import { db } from "@/db";
import { libraryItemSchema, userSettingsSchema } from "@/db/schema";
import { getToken } from "@/stores/session-store";
import { audiobookShelfFetch } from "./audiobookShelfBaseClient";
import { pingBackend } from "./pingApi";

export const formatSecondsToTime = (
  seconds: number,
  format: "timestamp" | "duration",
) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);

  if (format === "duration") {
    const hoursDisplay = h > 0 ? `${h}h ` : "";
    const minutesDisplay = m > 0 ? `${m}m ` : "";
    return `${hoursDisplay}${minutesDisplay}`.trim();
  } else {
    // padStart ensures there are always two digits
    if (h > 0) {
      return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
    }
    return [m, s].map((v) => v.toString().padStart(2, "0")).join(":");
  }
};

export const recordProgress = async (
  currentTrack: TrackItem,
  currentPosition: number,
) => {
  const extraPayload = currentTrack.extraPayload as TrackPlayerExtraPayload;
  const libraryItemId = extraPayload.libraryItemId;

  void db
    .update(libraryItemSchema)
    .set({
      audiobookLocation: currentPosition + extraPayload.start,
      audiobookProgress:
        (Math.round(
          ((currentPosition + extraPayload.start) /
            extraPayload.totalDuration) *
            1000,
        ) /
          1000) *
        100,
      complete: false,
      updatedAt: new Date(),
    })
    .where(eq(libraryItemSchema.id, libraryItemId))
    .run();
};

export const syncProgressWithServer = async () => {
  try {
    const userSettings = await db.query.userSettingsSchema.findFirst();

    if (!userSettings) {
      throw Error("unable to sync with server, no user settings found");
    }

    const pingResponse = await pingBackend();
    if (!pingResponse) {
      // console.log("not connected to server");
      return;
    }
    const lastSync = userSettings?.lastServerSync?.getTime() ?? 0;
    const progressUpdatesFromServer = await getProgressFromServer(lastSync);

    // collect progress updates from phone
    const updatedLibraryItems = await db
      .select({
        libraryItemId: libraryItemSchema.remoteId,
        isAudiobook: libraryItemSchema.isAudiobook,
        isEbook: libraryItemSchema.isEbook,
        currentTime: libraryItemSchema.audiobookLocation,
        progress: libraryItemSchema.audiobookProgress,
        ebookLocation: libraryItemSchema.ebookLocation,
        ebookProgress: libraryItemSchema.ebookProgress,
        isFinished: libraryItemSchema.complete,
        updatedAt: sql<number>`${libraryItemSchema.updatedAt}`.mapWith((val) =>
          new Date(val).getTime(),
        ),
      })
      .from(libraryItemSchema)
      .where(
        and(
          gt(libraryItemSchema.updatedAt, new Date(lastSync)),
          or(
            gt(libraryItemSchema.ebookProgress, 0),
            gt(libraryItemSchema.audiobookProgress, 0),
          ),
        ),
      );
    console.log(
      `Found ${updatedLibraryItems.length} library items with progress updates since last sync at ${new Date(lastSync)}`,
    );

    const ebookProgressFromPhone = updatedLibraryItems
      .filter((item) => item.isEbook)
      .map(
        (item) =>
          ({
            ...item,
            type: "ebook",
            source: "client",
          }) as EBookProgressUpdate,
      );

    const audioProgressFromPhone = updatedLibraryItems
      .filter((item) => item.isAudiobook)
      .map(
        (item) =>
          ({
            ...item,
            type: "audioBook",
            source: "client",
          }) as AudioBookProgressUpdate,
      );

    const progressUpdates = [
      ...progressUpdatesFromServer,
      ...ebookProgressFromPhone,
      ...audioProgressFromPhone,
    ].reduce(
      (
        acc: (EBookProgressUpdate | AudioBookProgressUpdate)[],
        obj: EBookProgressUpdate | AudioBookProgressUpdate,
      ) => {
        // console.log({ obj });
        const existingIndex = acc.findIndex(
          (item) => item.libraryItemId === obj.libraryItemId,
        );

        if (existingIndex === -1) {
          acc.push(obj);
        } else {
          const existingDate = new Date(acc[existingIndex].updatedAt);
          const newDate = new Date(obj.updatedAt);
          // console.log(
          //   `comparing progress update for library item ${obj.libraryItemId}, existing update time: ${existingDate}, new update time: ${newDate}`,
          // );

          if (newDate > existingDate) {
            acc[existingIndex] = obj;
          }
        }

        return acc;
      },
      [],
    );

    // update phone with server progress updates
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
      // console.log("no updates to make to sync progress with server");
    }

    for (const update of progressUpdates.filter(
      (update) => update.source === "server",
    )) {
      if (update.type === "ebook") {
        db.update(libraryItemSchema)
          .set({
            ebookLocation: (update as EBookProgressUpdate).ebookLocation,
            ebookProgress: (update as EBookProgressUpdate).ebookProgress,
            complete: update.isFinished,
            updatedAt: new Date(update.updatedAt),
          })
          .where(eq(libraryItemSchema.remoteId, update.libraryItemId))
          .run();
      } else if (update.type === "audioBook") {
        db.update(libraryItemSchema)
          .set({
            audiobookLocation: parseFloat(
              (update as AudioBookProgressUpdate).currentTime.toFixed(3),
            ),
            audiobookProgress: parseFloat(
              (update as AudioBookProgressUpdate).progress.toFixed(3),
            ),
            complete: update.isFinished,
            updatedAt: new Date(update.updatedAt),
          })
          .where(eq(libraryItemSchema.remoteId, update.libraryItemId))
          .run();
      } else {
        console.warn(`unknown progress update type: ${update}`);
      }
    }

    // update server with phone progress updates
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
        // console.log(
        //   "successfully updated progress to server",
        //   await result.text(),
        // );
      }
    }

    // console.log("updating sync time");
    db.update(userSettingsSchema).set({ lastServerSync: new Date() }).run();
  } catch (error) {
    console.error("Exception occurred while fetching user sessions", error);
    throw error;
  }
};

export const getProgressFromServer = async (lastSync: number) => {
  // console.log(
  //   `fetching progress updates from server since ${new Date(lastSync)}`,
  // );
  const response = await audiobookShelfFetch<Root>("/api/me");
  const serverMediaProgressItems =
    response?.mediaProgress.filter((media) => {
      // TODO: this might be a bug! when sync'ing things ping pong since either their is an async not being awaited or a precision error. First the client updates the server, then the server updates the client with the exact same progress
      return media.lastUpdate - lastSync > 1000;
    }) ?? [];
  // serverMediaProgressItems.forEach((media) => {
  // console.log(
  //   `checking if media progress item with library item id ${media.libraryItemId} should be included, last update time: ${media.lastUpdate}, last sync time: ${lastSync}, result: ${media.lastUpdate - lastSync > 5000}`,
  // );
  // );
  // });
  const results: (EBookProgressUpdate | AudioBookProgressUpdate)[] = [];

  for (const serverMedia of serverMediaProgressItems) {
    // TODO: figure out how to signal that item is complete
    //       isFinished: media.isFinished,
    if (serverMedia.currentTime) {
      results.push({
        libraryItemId: serverMedia.libraryItemId,
        currentTime: serverMedia.currentTime,
        progress: serverMedia.progress,
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
  // console.log("Found " + results.length + " progress items from server");
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
  progress: number;
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
  finishedAt: number | null;
}
