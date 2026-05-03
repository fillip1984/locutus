import { asc, eq } from "drizzle-orm";
import { create } from "zustand";

import { db } from "@/db";
import {
  audioFileSchema,
  eBookFileSchema,
  libraryItemSchema,
  libraryItemSchemaType,
  librarySchema,
  librarySchemaType,
} from "@/db/schema";
import { downloadCoverArt } from "@/services/coverArtApi";
import { getLibraries } from "@/services/libraryApi";
import { getLibraryItem, Root } from "@/services/libraryItemApi";
import { getLibraryItems } from "@/services/libraryItemsApi";

export interface LibraryStore {
  libraries: librarySchemaType[] | null;
  libraryItems: libraryItemSchemaType[] | null;
  status: "loading" | "loaded";

  refetch: () => void;
  syncWithServer: () => Promise<boolean>;
  addLibrary: (library: librarySchemaType) => void;
  removeLibrary: (id: string) => void;
}

export const useLibraryStore = create<LibraryStore>()((set, get) => ({
  libraries: null,
  libraryItems: null,
  status: "loading",
  refetch: async () => {
    set(() => ({ status: "loading" }));
    console.log("fetching libraries from db");
    const freshLibraryItems = await db
      .select()
      .from(libraryItemSchema)
      .orderBy(asc(libraryItemSchema.title));
    // TODO: add back other filters?
    // .where(
    //   and(
    //     request?.search
    //       ? or(
    //           like(libraryItemSchema.title, `%${request.search}%`),
    //           like(libraryItemSchema.authorName, `%${request.search}%`),
    //         )
    //       : undefined,
    //     request?.audioBookFilter
    //       ? gt(libraryItemSchema.numAudioFiles, 0)
    //       : undefined,
    //     request?.eBookFilter
    //       ? isNotNull(libraryItemSchema.ebookFileFormat)
    //       : undefined,
    //   ),
    // )
    // .orderBy(
    //   request?.sort === "Title"
    //     ? asc(libraryItemSchema.title)
    //     : request?.sort === "Published"
    //       ? desc(libraryItemSchema.publishedYear)
    //       : request?.sort === "Recent"
    //         ? desc(libraryItemSchema.updatedAt)
    //         : asc(libraryItemSchema.authorNameLF), // all other states sort by author
    // );
    set(() => ({ libraryItems: freshLibraryItems, status: "loaded" }));
  },
  syncWithServer: async () => {
    set(() => ({ status: "loading" }));
    const libraries = await getLibraries();
    for (const library of libraries ?? []) {
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
      const existingLibrary = await db
        .select()
        .from(librarySchema)
        .where(eq(librarySchema.remoteId, library.id));
      if (existingLibrary.length > 0) {
        libraryId = existingLibrary[0].id;
      }
      if (!libraryId) {
        // console.log("adding library");
        await db
          .insert(librarySchema)
          .values({ id: library.id, name: library.name, remoteId: library.id });
        libraryId = library.id;
      } else {
        // console.log("updating library");
        await db
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
        const exists = await db
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
          await db.insert(libraryItemSchema).values({
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
          await db
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
        if (!libraryItem) {
          console.error(
            `Failed to fetch library item with id: ${remoteId} after syncing libraries, skipping syncing related audio and ebook files for this item`,
          );
          continue;
        }
        if (libraryItem?.media.ebookFile) {
          const ebook = libraryItem.media.ebookFile;
          const exists = await db.query.eBookFileSchema.findFirst({
            where: {
              remoteId: ebook.ino,
            },
          });

          if (!exists) {
            await db.insert(eBookFileSchema).values({
              // TODO: this limits us to only 1 ebook at a time
              id: libraryItem.id,
              remoteId: ebook.ino,
              name: ebook.metadata.filename,
              libraryItemId: libraryItem.id,
            });
          } else {
            await db
              .update(eBookFileSchema)
              .set({
                name: ebook.metadata.filename,
              })
              .where(eq(eBookFileSchema.remoteId, ebook.ino));
          }
        }
        for (const audioFile of libraryItem?.media.audioFiles ?? []) {
          const exists = await db.query.audioFileSchema.findFirst({
            where: {
              remoteId: audioFile.ino,
            },
          });

          const [start, end] = calculateChapter(libraryItem, audioFile.index);
          if (!exists) {
            await db.insert(audioFileSchema).values({
              id: audioFile.ino,
              remoteId: audioFile.ino,
              index: audioFile.index,
              name: audioFile.metadata.filename,
              duration: audioFile.duration,
              start,
              end,
              libraryItemId: libraryItem.id,
            });
          } else {
            await db
              .update(audioFileSchema)
              .set({
                name: audioFile.metadata.filename,
                duration: audioFile.duration,
                start,
                end,
              })
              .where(eq(audioFileSchema.remoteId, audioFile.ino));
          }
        }
      }
    }
    console.log("refreshing library after sync with server");
    // expecting refetch to close out status
    get().refetch();
    return true;
  },
  addLibrary: async (library: librarySchemaType) => {
    await db.insert(librarySchema).values({
      // id: library.id,
      name: library.name,
      remoteId: library.remoteId,
    });
    get().refetch();
  },
  removeLibrary: async (id: string) => {
    await db.delete(librarySchema).where(eq(librarySchema.id, id));
    get().refetch();
  },
}));

const calculateChapter = (libraryItem: Root, index: number) => {
  try {
    const start =
      libraryItem.media && libraryItem.media.chapters.length > 0
        ? libraryItem.media.chapters[index - 1].start
        : 0;
    const end =
      libraryItem.media && libraryItem.media.chapters.length > 0
        ? libraryItem.media.chapters[index - 1].end
        : 0;
    return [start, end];
  } catch (error) {
    console.error("Error calculating chapter:", error);
    return [0, 0];
  }
};
