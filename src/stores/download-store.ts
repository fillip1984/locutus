import { eq } from "drizzle-orm";
import { create } from "zustand";

import { db } from "@/db";
import { audioChapterSchemaType, libraryItemSchema } from "@/db/schema";
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
        // console.log(`downloading libraryItemId: ${libraryItemId}`);
        const libraryItem = await db.query.libraryItemSchema.findFirst({
          where: {
            id: libraryItemId,
          },
          with: {
            audioChapters: true,
            ebook: true,
          },
        });

        if (!libraryItem) {
          throw Error(
            `Unable to download audio files for library item id: ${libraryItemId}`,
          );
        }
        if (libraryItem.ebook) {
          await downloadLibraryItem(
            libraryItem.remoteId,
            libraryItem.ebook.remoteId,
            libraryItem.ebook.ebookFormat,
          );
        }

        // for (const audioChapter of libraryItem.audioChapters) {
        for (const audioChapter of libraryItem.audioChapters.reduce(
          (acc: audioChapterSchemaType[], chapter) => {
            const duplicateDownloadDueToM4b = acc.findIndex(
              (c) => c.mediaRemoteId === chapter.mediaRemoteId,
            );
            if (duplicateDownloadDueToM4b === -1) {
              acc.push(chapter);
            }
            return acc;
          },
          [],
        )) {
          // console.log(`downloading audioFile: ${audioFile.name}`);
          await downloadLibraryItem(
            libraryItem.remoteId,
            audioChapter.mediaRemoteId,
            audioChapter.mediaFormat,
          );
        }
        await db
          .update(libraryItemSchema)
          .set({ downloaded: true })
          .where(eq(libraryItemSchema.id, libraryItemId));
        useLibraryStore.getState().refetch();
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
          // console.log("queue still has items in it, going again for download");
          get().download();
        } else {
          // console.log("queue is empty, sync progress with server");
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
