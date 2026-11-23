import { TrackItem } from "react-native-nitro-player";

import { and, eq, gt, isNotNull, or, sql } from "drizzle-orm";

import { TrackPlayerExtraPayload } from "@/app/_layout";
import { db } from "@/db";
import { libraryItemSchema, userSettingsSchema } from "@/db/schema";
import { getToken } from "@/stores/session-store";
import { audiobookShelfFetch } from "./audiobookShelfBaseClient";
import { pingBackend } from "./pingApi";
import {
  AudioBookProgressUpdate,
  buildServerPayload,
  calculateLocalProgress,
  EBookProgressUpdate,
  fractionToPercent,
  isAlreadyOnServer,
  mergeProgressUpdates,
  percentToFraction,
  Root,
  selectServerUpdates,
} from "./progress-utils";

export { formatSecondsToTime } from "./progress-utils";
export type { MediaProgress, Root } from "./progress-utils";

const SYNC_REQUEST_TIMEOUT_MS = 15000;

export const recordProgress = async (
  currentTrack: TrackItem,
  currentPosition: number,
) => {
  const extraPayload = currentTrack.extraPayload as
    TrackPlayerExtraPayload | undefined;
  if (!extraPayload?.libraryItemId) {
    return;
  }

  // single file books report positions for the whole file, so they need no chapter offset
  const audiobookPosition =
    extraPayload.playlistType === "file-for-all-chapters"
      ? currentPosition
      : currentPosition + (extraPayload.start ?? 0);

  try {
    db.update(libraryItemSchema)
      .set({
        ...calculateLocalProgress(
          audiobookPosition,
          extraPayload.totalDuration,
        ),
        updatedAt: new Date(),
      })
      .where(eq(libraryItemSchema.id, extraPayload.libraryItemId))
      .run();
  } catch (error) {
    console.error("Unable to record progress", error);
  }
};

let syncInFlight: Promise<void> | null = null;

// overlapping triggers (settings button, login, downloads) share one sync
export const syncProgressWithServer = () => {
  syncInFlight ??= runProgressSync().finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
};

const runProgressSync = async () => {
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

    // taken before collecting changes so progress recorded during the sync is picked up next time
    const syncStartedAt = new Date();
    const lastSync = userSettings.lastServerSync?.getTime() ?? 0;

    const serverResponse = await audiobookShelfFetch<Root>("/api/me");
    if (!serverResponse) {
      throw Error("unable to fetch progress from server");
    }
    const serverMediaProgress = serverResponse.mediaProgress ?? [];
    const progressUpdatesFromServer = selectServerUpdates(
      serverMediaProgress,
      lastSync,
    );

    // collect progress updates from phone
    const updatedLibraryItems = await db
      .select({
        libraryItemId: libraryItemSchema.remoteId,
        isAudiobook: libraryItemSchema.isAudiobook,
        isEbook: libraryItemSchema.isEbook,
        currentTime: libraryItemSchema.audiobookLocation,
        duration: libraryItemSchema.audiobookDuration,
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
          // a location of 0 is progress too (item marked unread)
          or(
            isNotNull(libraryItemSchema.audiobookLocation),
            isNotNull(libraryItemSchema.ebookLocation),
          ),
        ),
      );
    console.log(
      `Found ${updatedLibraryItems.length} library items with progress updates since last sync at ${new Date(lastSync)}`,
    );

    const ebookProgressFromPhone: EBookProgressUpdate[] = [];
    const audioProgressFromPhone: AudioBookProgressUpdate[] = [];
    for (const item of updatedLibraryItems) {
      if (item.isEbook && item.ebookLocation != null) {
        ebookProgressFromPhone.push({
          libraryItemId: item.libraryItemId,
          ebookLocation: item.ebookLocation,
          ebookProgress: percentToFraction(item.ebookProgress ?? 0),
          isFinished: item.isFinished,
          updatedAt: item.updatedAt,
          type: "ebook",
          source: "client",
        });
      }
      if (item.isAudiobook && item.currentTime != null) {
        audioProgressFromPhone.push({
          libraryItemId: item.libraryItemId,
          currentTime: item.currentTime,
          progress: percentToFraction(item.progress ?? 0),
          duration: item.duration ?? undefined,
          isFinished: item.isFinished,
          updatedAt: item.updatedAt,
          type: "audioBook",
          source: "client",
        });
      }
    }

    const progressUpdates = mergeProgressUpdates([
      ...progressUpdatesFromServer,
      ...ebookProgressFromPhone,
      ...audioProgressFromPhone,
    ]);

    // update phone with server progress updates
    // TODO: doesn't appear expo sqlite supports transactions... add back later
    const serverUpdates = progressUpdates.filter((i) => i.source === "server");
    const clientUpdates = progressUpdates.filter(
      (i) =>
        i.source === "client" && !isAlreadyOnServer(i, serverMediaProgress),
    );

    console.log({ msg: "Updates from server", length: serverUpdates.length });
    console.log({ msg: "Updates from client", length: clientUpdates.length });

    for (const update of serverUpdates) {
      if (update.type === "ebook") {
        db.update(libraryItemSchema)
          .set({
            ebookLocation: update.ebookLocation,
            ebookProgress: fractionToPercent(update.ebookProgress ?? 0),
            complete: update.isFinished,
            updatedAt: new Date(update.updatedAt),
          })
          .where(
            and(
              eq(libraryItemSchema.remoteId, update.libraryItemId),
              eq(libraryItemSchema.isEbook, true),
            ),
          )
          .run();
      } else {
        db.update(libraryItemSchema)
          .set({
            audiobookLocation: parseFloat(update.currentTime.toFixed(3)),
            audiobookProgress: fractionToPercent(update.progress),
            complete: update.isFinished,
            updatedAt: new Date(update.updatedAt),
          })
          .where(
            and(
              eq(libraryItemSchema.remoteId, update.libraryItemId),
              eq(libraryItemSchema.isAudiobook, true),
            ),
          )
          .run();
      }
    }

    // update server with phone progress updates
    if (clientUpdates.length > 0) {
      const token = await getToken();
      if (!token) {
        throw Error("unable to find authentication token");
      }

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        SYNC_REQUEST_TIMEOUT_MS,
      );
      try {
        const result = await fetch(
          `${userSettings.serverUrl}/api/me/progress/batch/update`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(buildServerPayload(clientUpdates)),
            signal: controller.signal,
          },
        );
        if (!result.ok) {
          throw Error(
            `failed to update progress on server, status: ${result.status}`,
          );
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    // only reached when everything succeeded, so failed pushes are retried next sync
    db.update(userSettingsSchema).set({ lastServerSync: syncStartedAt }).run();
  } catch (error) {
    console.error("Unable to sync progress with server", error);
    throw error;
  }
};
