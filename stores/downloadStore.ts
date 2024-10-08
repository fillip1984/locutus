import { eq } from "drizzle-orm";
import Toast from "react-native-toast-message";
import { create } from "zustand";

import { useLibraryStore } from "./libraryStore";
import { useMediaStore } from "./mediaStore";

import { localDb } from "@/db";
import {
  libraryItemAudioFileSchema,
  libraryItemEBookFileSchema,
  libraryItemSchema,
} from "@/db/schema";
import { downloadLibraryItem } from "@/services/libraryItemApi";
import { syncProgressWithServer } from "@/services/progressService";

export interface DownloadStore {
  queue: string[];
  downloading: boolean;
  add: (libraryItemId: string) => void;
  download: () => void;
  isDownloading: (libraryItemId?: string) => boolean;
}

export const useDownloadStore = create<DownloadStore>()((set, get) => ({
  queue: [],
  downloading: false,
  add: (libraryItemId: string) => {
    // console.log(`adding libraryItemId: ${libraryItemId} for download`);
    set((state) => ({ queue: [...state.queue, libraryItemId] }));
  },
  download: async () => {
    set(() => ({ downloading: true }));
    const libraryItemIds = get().queue;
    for (const libraryItemId of libraryItemIds) {
      try {
        // console.log(`downloading libraryItemId: ${libraryItemId}`);
        const libraryItem = await localDb.query.libraryItemSchema.findFirst({
          where: eq(libraryItemSchema.id, libraryItemId),
        });

        if (!libraryItem) {
          throw Error(
            `Unable to download audio files for library item id: ${libraryItemId}`,
          );
        }
        const ebookToDownload =
          await localDb.query.libraryItemEBookFileSchema.findFirst({
            where: eq(libraryItemEBookFileSchema.libraryItemId, libraryItem.id),
          });
        if (ebookToDownload) {
          const ebookFile = await downloadLibraryItem(
            libraryItem.remoteId,
            ebookToDownload.remoteId,
            ebookToDownload.name,
          );

          await localDb
            .update(libraryItemEBookFileSchema)
            .set({ path: ebookFile })
            .where(
              eq(libraryItemEBookFileSchema.remoteId, ebookToDownload.remoteId),
            );
        }
        const audioFilesToDownload =
          await localDb.query.libraryItemAudioFileSchema.findMany({
            where: eq(libraryItemAudioFileSchema.libraryItemId, libraryItem.id),
          });
        for (const audioFile of audioFilesToDownload) {
          // console.log(`downloading audioFile: ${audioFile.name}`);
          const file = await downloadLibraryItem(
            libraryItem.remoteId,
            audioFile.remoteId,
            audioFile.name,
          );
          await localDb
            .update(libraryItemAudioFileSchema)
            .set({ path: file })
            .where(eq(libraryItemAudioFileSchema.remoteId, audioFile.remoteId));
          // console.log(`downloaded audioFile: ${audioFile.name}`);
        }
        await localDb
          .update(libraryItemSchema)
          .set({ downloaded: true })
          .where(eq(libraryItemSchema.id, libraryItemId));
        //reload if we're still on the same page
        if (useMediaStore.getState().libraryItem?.id === libraryItem.id) {
          useMediaStore.getState().refetch(libraryItemId);
        }
        useLibraryStore.getState().refetch();
        // console.log(`downloaded libraryItemId: ${libraryItemId}`);
        Toast.show({
          type: "success",
          text1: `Downloaded audio files for ${libraryItem.title}`,
          position: "bottom",
        });
        return true;
      } catch (err) {
        console.error(
          `Unable to download libraryItemId: ${libraryItemId}`,
          err,
        );
      } finally {
        //error or not, dequeue
        set((state) => ({
          queue: state.queue.filter((id) => id !== libraryItemId),
          downloading: false,
        }));
        if (get().queue.length !== 0) {
          console.log("queue still has items in it, going again for download");
          get().download();
        } else {
          console.log("queue is empty, sync progress with server");
          await syncProgressWithServer();
          useLibraryStore.getState().refetch();
        }
      }
    }
  },
  isDownloading: (libraryItemId?: string) => {
    if (libraryItemId) {
      // console.log(
      //   `checking if library item is being downloaded. LibraryItemId: ${libraryItemId}`,
      // );
      return get().queue.find((q) => q === libraryItemId) !== undefined;
    }

    return get().downloading;
  },
}));

// TODO: not sure if I like this manner of triggering downloads but it works
export const handleDownload = async (libraryItemId: string) => {
  const downloadStore = useDownloadStore.getState();
  Toast.show({
    type: "info",
    text1: "Downloading files",
    position: "bottom",
  });
  downloadStore.add(libraryItemId);
  if (!downloadStore.isDownloading()) {
    downloadStore.download();
  }
};
