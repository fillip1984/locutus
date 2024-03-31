import { eq } from "drizzle-orm";
import { create } from "zustand";

import { localDb } from "@/db";
import {
  LibraryItemSchemaType,
  LibrarySchemaType,
  libraryItemAudioFileSchema,
  libraryItemSchema,
  librarySchema,
} from "@/db/schema";
import { downloadCoverArt } from "@/services/coverArtApi";
import { getLibraries } from "@/services/libraryApi";
import { getLibraryItem } from "@/services/libraryItemApi";
import { getLibraryItems } from "@/services/libraryItemsApi";

export interface LibraryState {
  libraries: LibrarySchemaType[] | null;
  libraryItems: LibraryItemSchemaType[] | null;

  refetch: () => void;
  syncWithServer: () => Promise<boolean>;
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
  syncWithServer: async () => {
    const libraries = await getLibraries();
    for (const library of libraries) {
      // insert or update library
      // TODO: couldn't get this to work
      // await localDb
      //   .insert(librarySchema)
      //   .values({ name: library.name, remoteId: library.id })
      //   .onConflictDoUpdate({
      //     target: librarySchema.id,
      //     set: { name: library.name + new Date(), remoteId: library.id },
      //   });
      let libraryId = null;
      const existingLibrary = await localDb
        .select()
        .from(librarySchema)
        .where(eq(librarySchema.remoteId, library.id));
      if (existingLibrary.length > 0) {
        libraryId = existingLibrary[0].id;
      }
      if (!libraryId) {
        console.log("adding library");
        const result = await localDb
          .insert(librarySchema)
          .values({ name: library.name, remoteId: library.id });
        libraryId = result.lastInsertRowId;
      } else {
        console.log("updating library");
        await localDb
          .update(librarySchema)
          .set({ name: library.name })
          .where(eq(librarySchema.remoteId, library.id));
      }

      const items = await getLibraryItems(library.id);
      // filter down to audiobooks
      const audiobookItems = items.filter(
        (item) => item.media.numAudioFiles > 0,
      );
      for (const item of audiobookItems) {
        const remoteId = item.id;
        let libraryItemId = null;
        const exists = await localDb
          .select()
          .from(libraryItemSchema)
          .where(eq(libraryItemSchema.remoteId, remoteId));
        if (exists.length > 0) {
          libraryItemId = exists[0].id;
        }

        //download cover art
        const coverArtPath = await downloadCoverArt(item.id);

        if (!libraryItemId) {
          console.log("adding library item");
          const result = await localDb.insert(libraryItemSchema).values({
            title: item.media.metadata.title,
            authorName: item.media.metadata.authorName,
            duration: item.media.duration,
            numAudioFiles: item.media.numAudioFiles,
            description: item.media.metadata.description,
            publishedYear: item.media.metadata.publishedYear
              ? parseInt(item.media.metadata.publishedYear)
              : null,
            coverArtPath,
            libraryId,
            remoteId: item.id,
          });
          libraryItemId = result.lastInsertRowId;
        } else {
          console.log("updating library item");
          await localDb
            .update(libraryItemSchema)
            .set({
              title: item.media.metadata.title,
              authorName: item.media.metadata.authorName,
              duration: item.media.duration,
              numAudioFiles: item.media.numAudioFiles,
              coverArtPath,
              libraryId,
              remoteId: item.id,
            })
            .where(eq(libraryItemSchema.remoteId, item.id));
        }

        const audioFiles = await getLibraryItem(remoteId);
        for (const audioFile of audioFiles) {
          await localDb.insert(libraryItemAudioFileSchema).values({
            remoteId: audioFile.ino,
            index: audioFile.index,
            duration: audioFile.duration,
            name: audioFile.metadata.filename,
            libraryItemId,
          });
        }
      }
    }
    get().refetch();
    return true;
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
