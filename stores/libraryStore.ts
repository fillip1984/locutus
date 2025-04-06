import { and, asc, desc, eq, gt, isNotNull, like, or } from "drizzle-orm";
import { create } from "zustand";

import { localDb } from "@/db";
import {
  LibraryItemSchemaType,
  LibrarySchemaType,
  libraryItemAudioFileSchema,
  libraryItemEBookFileSchema,
  libraryItemSchema,
  librarySchema,
} from "@/db/schema";
import { downloadCoverArt } from "@/services/coverArtApi";
import { getLibraries } from "@/services/libraryApi";
import { getLibraryItem } from "@/services/libraryItemApi";
import { getLibraryItems } from "@/services/libraryItemsApi";

export interface LibraryStoreRefetchRequest {
  search?: string;
  sort?: LibraryItemSort;
  eBookFilter?: boolean;
  audioBookFilter?: boolean;
}

export interface LibraryStore {
  libraries: LibrarySchemaType[] | null;
  libraryItems: LibraryItemSchemaType[] | null;
  status: "loading" | "loaded";

  refetch: (request?: LibraryStoreRefetchRequest) => void;
  syncWithServer: () => Promise<boolean>;
  addLibrary: (library: LibrarySchemaType) => void;
  removeLibrary: (id: string) => void;
}

export type LibraryItemSort = "Author" | "Title" | "Published" | "Recent";

export const useLibraryStore = create<LibraryStore>()((set, get) => ({
  libraries: null,
  libraryItems: null,
  status: "loading",
  refetch: async (request?: LibraryStoreRefetchRequest) => {
    set(() => ({ status: "loading" }));
    const freshLibraryItems = await localDb
      .select()
      .from(libraryItemSchema)
      .where(
        and(
          request?.search
            ? or(
                like(libraryItemSchema.title, `%${request.search}%`),
                like(libraryItemSchema.authorName, `%${request.search}%`),
              )
            : undefined,
          request?.audioBookFilter
            ? gt(libraryItemSchema.numAudioFiles, 0)
            : undefined,
          request?.eBookFilter
            ? isNotNull(libraryItemSchema.ebookFileFormat)
            : undefined,
        ),
      )
      .orderBy(
        request?.sort === "Title"
          ? asc(libraryItemSchema.title)
          : request?.sort === "Published"
            ? desc(libraryItemSchema.publishedYear)
            : request?.sort === "Recent"
              ? desc(libraryItemSchema.updatedAt)
              : asc(libraryItemSchema.authorNameLF), // all other states sort by author
      );
    set(() => ({ libraryItems: freshLibraryItems, status: "loaded" }));
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
        // console.log("adding library");
        await localDb
          .insert(librarySchema)
          .values({ id: library.id, name: library.name, remoteId: library.id });
        libraryId = library.id;
      } else {
        // console.log("updating library");
        await localDb
          .update(librarySchema)
          .set({ name: library.name })
          .where(eq(librarySchema.remoteId, library.id));
      }

      const items = await getLibraryItems(library.id);
      // filter down to audiobooks
      // const audiobookItems = items.filter(
      //   (item) => item.media.numAudioFiles > 0,
      // );
      for (const item of items) {
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
          // console.log("adding library item");
          await localDb.insert(libraryItemSchema).values({
            id: item.id,
            title: item.media.metadata.title,
            authorName: item.media.metadata.authorName,
            authorNameLF: item.media.metadata.authorNameLF,
            duration: item.media.duration,
            numAudioFiles: item.media.numAudioFiles,
            ebookFileFormat: item.media.ebookFormat,
            description: item.media.metadata.description,
            publishedYear: item.media.metadata.publishedYear
              ? parseInt(item.media.metadata.publishedYear, 10)
              : null,
            coverArtPath,
            libraryId,
            remoteId: item.id,
          });
          // libraryItemId = result.lastInsertRowId;
        } else {
          // console.log("updating library item");
          await localDb
            .update(libraryItemSchema)
            .set({
              title: item.media.metadata.title,
              authorName: item.media.metadata.authorName,
              authorNameLF: item.media.metadata.authorNameLF,
              duration: item.media.duration,
              numAudioFiles: item.media.numAudioFiles,
              ebookFileFormat: item.media.ebookFormat,
              coverArtPath,
              libraryId,
              remoteId: item.id,
            })
            .where(eq(libraryItemSchema.remoteId, item.id));
        }

        const libraryItem = await getLibraryItem(remoteId);
        if (libraryItem.media.ebookFile) {
          const ebook = libraryItem.media.ebookFile;
          const exists =
            await localDb.query.libraryItemEBookFileSchema.findFirst({
              where: eq(libraryItemEBookFileSchema.remoteId, ebook.ino),
            });

          if (!exists) {
            await localDb.insert(libraryItemEBookFileSchema).values({
              // TODO: this limits us to only 1 ebook at a time
              id: libraryItem.id,
              remoteId: ebook.ino,
              name: ebook.metadata.filename,
              libraryItemId: libraryItem.id,
            });
          } else {
            await localDb
              .update(libraryItemEBookFileSchema)
              .set({
                name: ebook.metadata.filename,
              })
              .where(eq(libraryItemEBookFileSchema.remoteId, ebook.ino));
          }
        }
        for (const audioFile of libraryItem.media.audioFiles) {
          const exists =
            await localDb.query.libraryItemAudioFileSchema.findFirst({
              where: eq(libraryItemAudioFileSchema.remoteId, audioFile.ino),
            });
          if (!exists) {
            await localDb.insert(libraryItemAudioFileSchema).values({
              id: audioFile.ino,
              remoteId: audioFile.ino,
              index: audioFile.index,
              name: audioFile.metadata.filename,
              duration: audioFile.duration,
              start: libraryItem.media.chapters[audioFile.index - 1].start,
              end: libraryItem.media.chapters[audioFile.index - 1].end,
              libraryItemId: libraryItem.id,
            });
          } else {
            await localDb
              .update(libraryItemAudioFileSchema)
              .set({
                name: audioFile.metadata.filename,
                duration: audioFile.duration,
                start: libraryItem.media.chapters[audioFile.index - 1].start,
                end: libraryItem.media.chapters[audioFile.index - 1].end,
              })
              .where(eq(libraryItemAudioFileSchema.remoteId, audioFile.ino));
          }
        }
      }
    }
    console.log("refreshing library after sync with server");
    get().refetch();
    return true;
  },
  addLibrary: async (library: LibrarySchemaType) => {
    await localDb.insert(librarySchema).values({
      id: library.id,
      name: library.name,
      remoteId: library.remoteId,
    });
    get().refetch();
  },
  removeLibrary: async (id: string) => {
    await localDb.delete(librarySchema).where(eq(librarySchema.id, id));
    get().refetch();
  },
}));
