import { eq } from "drizzle-orm";
import { create } from "zustand";

import { localDb } from "@/db";
import {
  LibraryItemSchemaType,
  LibrarySchemaType,
  libraryItemSchema,
  librarySchema,
} from "@/db/schema";

export interface LibraryState {
  libraries: LibrarySchemaType[] | null;
  libraryItems: LibraryItemSchemaType[] | null;

  refetch: () => void;
  addLibrary: (library: LibrarySchemaType) => void;
  removeLibrary: (id: number) => void;
}

export const useLibraryState = create<LibraryState>()((set, get) => ({
  libraries: null,
  libraryItems: null,
  refetch: async () => {
    const freshLibraries = await localDb.select().from(librarySchema);
    set(() => ({ libraries: freshLibraries }));
    const freshLibraryItems = await localDb.select().from(libraryItemSchema);
    set(() => ({ libraryItems: freshLibraryItems }));
  },
  addLibrary: async (library: LibrarySchemaType) => {
    await localDb.insert(librarySchema).values({
      name: library.name,
      remoteId: library.remoteId,
    });
    get().refetch();
  },
  removeLibrary: async (id: number) => {
    await localDb.delete(librarySchema).where(eq(librarySchema.id, id));
    get().refetch();
  },
}));
