import { eq } from "drizzle-orm";
import { create } from "zustand";

import { db } from "@/db";
import {
  audioFileSchema,
  eBookFileSchema,
  libraryItemSchema,
} from "@/db/schema";
import { downloadLibraryItem } from "@/services/libraryItemApi";
import { syncProgressWithServer } from "@/services/progressService";
import { useLibraryStore } from "./library-store";

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
        console.log(`downloading libraryItemId: ${libraryItemId}`);
        const libraryItem = await db.query.libraryItemSchema.findFirst({
          where: {
            id: libraryItemId,
          },
          with: {
            audioFiles: true,
            eBookFiles: true,
          },
        });

        if (!libraryItem) {
          throw Error(
            `Unable to download audio files for library item id: ${libraryItemId}`,
          );
        }
        if (libraryItem.eBookFiles.length > 0) {
          const ebookFile = await downloadLibraryItem(
            libraryItem.remoteId,
            libraryItem.eBookFiles[0].remoteId,
            libraryItem.eBookFiles[0].name,
          );

          await db
            .update(eBookFileSchema)
            .set({ path: ebookFile })
            .where(
              eq(eBookFileSchema.remoteId, libraryItem.eBookFiles[0].remoteId),
            );
        }
        // const audioFilesToDownload = await db.query.audioFileSchema.findMany({
        //   where: {
        //     id: libraryItem.id,
        //   },
        // });
        console.log({ files: libraryItem.audioFiles });
        for (const audioFile of libraryItem.audioFiles) {
          console.log(`downloading audioFile: ${audioFile.name}`);
          const file = await downloadLibraryItem(
            libraryItem.remoteId,
            audioFile.remoteId,
            audioFile.name,
          );
          await db
            .update(audioFileSchema)
            .set({ path: file })
            .where(eq(audioFileSchema.remoteId, audioFile.remoteId));
          console.log(
            `downloaded audioFile: ${audioFile.name} to path: ${file}`,
          );
        }
        await db
          .update(libraryItemSchema)
          .set({ downloaded: true })
          .where(eq(libraryItemSchema.id, libraryItemId));
        // //reload if we're still on the same page
        // if (useMediaStore.getState().libraryItem?.id === libraryItem.id) {
        //   useMediaStore.getState().refetch(libraryItemId);
        // }
        useLibraryStore.getState().refetch();
        // console.log(`downloaded libraryItemId: ${libraryItemId}`);
        // Toast.show({
        //   type: "success",
        //   text1: `Downloaded audio files for ${libraryItem.title}`,
        //   position: "bottom",
        // });
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
  // Toast.show({
  //   type: "info",
  //   text1: "Downloading files",
  //   position: "bottom",
  // });
  downloadStore.add(libraryItemId);
  if (!downloadStore.isDownloading()) {
    downloadStore.download();
  }
};
