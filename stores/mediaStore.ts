import { eq } from "drizzle-orm";
import { create } from "zustand";

import { useLibraryStore } from "./libraryStore";

import { localDb } from "@/db";
import {
  LibraryItemAudioFileSchemaType,
  LibraryItemEBookFileSchemaType,
  LibraryItemSchemaType,
  libraryItemAudioFileSchema,
  libraryItemEBookFileSchema,
  libraryItemSchema,
} from "@/db/schema";

export interface MediaStore {
  libraryItem: LibraryItemSchemaType | null;
  audioFiles: LibraryItemAudioFileSchemaType[] | null;
  ebook: LibraryItemEBookFileSchemaType | null;
  refetch: (id: number) => void;
  deleteLibraryItem: (libraryItemId: number) => Promise<boolean>;
}

export const useMediaStore = create<MediaStore>()((set, get) => ({
  libraryItem: null,
  audioFiles: null,
  ebook: null,
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

    const ebookResults =
      await localDb.query.libraryItemEBookFileSchema.findFirst({
        where: eq(libraryItemEBookFileSchema.libraryItemId, id),
      });

    set(() => ({ ebook: ebookResults }));

    // refresh ajacent store
    useLibraryStore.getState().refetch();
    // console.log("fetched media Store");
  },
  deleteLibraryItem: async (libraryItemId: number) => {
    console.warn("Not yet implemented");
    return true;
  },
}));
