import { eq } from "drizzle-orm";
import { create } from "zustand";

import { useLibraryStore } from "./libraryStore";

import { localDb } from "@/db";
import {
  LibraryItemAudioFileSchemaType,
  LibraryItemSchemaType,
  libraryItemAudioFileSchema,
  libraryItemSchema,
} from "@/db/schema";
import { downloadLibraryItem } from "@/services/libraryItemApi";

export interface MediaStore {
  libraryItem: LibraryItemSchemaType | null;
  audioFiles: LibraryItemAudioFileSchemaType[] | null;
  isDownloading: boolean;
  refetch: (id: number) => void;
  downloadAudioFiles: () => Promise<boolean>;
}

export const useMediaStore = create<MediaStore>()((set, get) => ({
  libraryItem: null,
  audioFiles: null,
  isDownloading: false,
  refetch: async (id: number) => {
    // console.log("fetching media Store");
    const result = await localDb
      .select()
      .from(libraryItemSchema)
      .where(eq(libraryItemSchema.id, id));
    if (result.length === 1) {
      set(() => ({ libraryItem: result[0] }));
    } else {
      throw Error(`Unable to find library item with id: ${id}`);
    }

    const audioResults = await localDb
      .select()
      .from(libraryItemAudioFileSchema)
      .where(eq(libraryItemAudioFileSchema.libraryItemId, id));
    set(() => ({ audioFiles: audioResults }));

    // refresh ajacent store
    useLibraryStore.getState().refetch();
    // console.log("fetched media Store");
  },
  downloadAudioFiles: async () => {
    const toDownload = get().audioFiles;
    if (!toDownload) {
      throw Error("No audio files to download");
    }

    const libraryItemId = get().libraryItem?.id;
    if (!libraryItemId) {
      throw Error(
        "Unable to download audio files for library...missing library item id",
      );
    }

    const remoteId = get().libraryItem?.remoteId;
    if (!remoteId) {
      throw Error(
        "Unable to download audio files for library...missing remote id",
      );
    }

    try {
      set(() => ({ isDownloading: true }));

      for (const audioFile of toDownload) {
        const file = await downloadLibraryItem(
          remoteId,
          audioFile.remoteId,
          audioFile.name,
        );
        await localDb
          .update(libraryItemAudioFileSchema)
          .set({ path: file })
          .where(eq(libraryItemAudioFileSchema.remoteId, audioFile.remoteId));
        // console.log(`downloaded audio file, result: ${file}`);
      }
      await localDb
        .update(libraryItemSchema)
        .set({ downloaded: true })
        .where(eq(libraryItemSchema.id, libraryItemId));
      get().refetch(libraryItemId);
      return true;
    } finally {
      set(() => ({ isDownloading: false }));
    }
  },
}));
