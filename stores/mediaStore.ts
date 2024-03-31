import { eq } from "drizzle-orm";
import { create } from "zustand";

import { localDb } from "@/db";
import {
  LibraryItemAudioFileSchemaType,
  LibraryItemSchemaType,
  libraryItemAudioFileSchema,
  libraryItemSchema,
} from "@/db/schema";

export interface MediaState {
  libraryItem: LibraryItemSchemaType | null;
  audioFiles: LibraryItemAudioFileSchemaType[] | null;
  refetch: (id: number) => void;
}

export const useMediaState = create<MediaState>()((set, get) => ({
  libraryItem: null,
  audioFiles: null,
  refetch: async (id: number) => {
    console.log("fetching media state");
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
    console.log("fetched media state");
  },
}));
