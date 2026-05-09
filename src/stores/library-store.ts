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
    // console.log("fetching libraries from db");
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
    const remoteLibraries = await getLibraries();
    for (const remoteLibrary of remoteLibraries ?? []) {
      // insert or update library
      await db
        .insert(librarySchema)
        .values({ name: remoteLibrary.name, remoteId: remoteLibrary.id })
        .onConflictDoUpdate({
          target: librarySchema.remoteId,
          set: { name: remoteLibrary.name },
        });

      // sync library items
      const remoteItems = (await getLibraryItems(remoteLibrary.id)) ?? [];
      for (const remoteItem of remoteItems) {
        console.log(
          `syncing library item with id: ${remoteItem.id} and title: ${remoteItem.media.metadata.title}`,
        );
        // download cover art
        const coverArtPath = await downloadCoverArt(remoteItem.id);

        const libraryItem = await db
          .insert(libraryItemSchema)
          .values({
            id: remoteItem.id,
            title: remoteItem.media.metadata.title,
            authorName: remoteItem.media.metadata.authorName,
            authorNameLF: remoteItem.media.metadata.authorNameLF,
            duration: remoteItem.media.duration,
            numAudioFiles: remoteItem.media.numAudioFiles,
            ebookFileFormat: remoteItem.media.ebookFormat,
            description: remoteItem.media.metadata.description,
            publishedYear: remoteItem.media.metadata.publishedYear
              ? parseInt(remoteItem.media.metadata.publishedYear, 10)
              : null,
            coverArtPath,
            libraryId: remoteLibrary.id,
            remoteId: remoteItem.id,
          })
          .onConflictDoUpdate({
            target: [libraryItemSchema.remoteId, libraryItemSchema.libraryId],
            set: {
              title: remoteItem.media.metadata.title,
              authorName: remoteItem.media.metadata.authorName,
              authorNameLF: remoteItem.media.metadata.authorNameLF,
              duration: remoteItem.media.duration,
              numAudioFiles: remoteItem.media.numAudioFiles,
              ebookFileFormat: remoteItem.media.ebookFormat,
              description: remoteItem.media.metadata.description,
              publishedYear: remoteItem.media.metadata.publishedYear
                ? parseInt(remoteItem.media.metadata.publishedYear, 10)
                : null,
              coverArtPath,
            },
          })
          .returning({ id: libraryItemSchema.id });
        const libraryItemId = libraryItem[0].id;

        const remoteLibraryItem = await getLibraryItem(remoteItem.id);
        if (!remoteLibraryItem) {
          console.error(
            `Failed to fetch library item with id: ${remoteItem.id} after syncing libraries, skipping syncing related audio and ebook files for this item`,
          );
          continue;
        }

        // ebooks/audio files
        if (remoteLibraryItem?.media.ebookFile) {
          const ebook = remoteLibraryItem.media.ebookFile;
          console.log(
            `syncing ebook file with id: ${ebook.ino} and name: ${ebook.metadata.filename} for library item with id: ${remoteLibraryItem.id}`,
          );
          await db
            .insert(eBookFileSchema)
            .values({
              // TODO: this limits us to only 1 ebook at a time
              id: remoteLibraryItem.id,
              remoteId: ebook.ino,
              name: ebook.metadata.filename,
              libraryItemId: libraryItemId,
            })
            .onConflictDoUpdate({
              target: eBookFileSchema.remoteId,
              set: {
                name: ebook.metadata.filename,
              },
            });
        }
        for (const audioFile of remoteLibraryItem?.media.audioFiles ?? []) {
          console.log(
            `syncing audio file with id: ${audioFile.ino} and name: ${audioFile.metadata.filename} for library item with id: ${remoteLibraryItem.id}`,
          );
          const [start, end] = calculateChapter(
            remoteLibraryItem,
            audioFile.index,
          );

          await db
            .insert(audioFileSchema)
            .values({
              id: audioFile.ino,
              remoteId: audioFile.ino,
              index: audioFile.index,
              name: audioFile.metadata.filename,
              duration: audioFile.duration,
              start,
              end,
              libraryItemId: libraryItemId,
            })
            .onConflictDoUpdate({
              target: audioFileSchema.remoteId,
              set: {
                index: audioFile.index,
                name: audioFile.metadata.filename,
                duration: audioFile.duration,
                start,
                end,
              },
            });
        }
      }
    }
    // console.log("refreshing library after sync with server");
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
    if (
      !libraryItem.media.chapters ||
      libraryItem.media.chapters.length === 0
    ) {
      console.warn("No chapters found for library item:", {
        title: libraryItem.media.metadata.title,
        id: libraryItem.id,
        chapters: libraryItem.media.chapters,
      });
      return [0, 0];
    }
    const start = libraryItem.media.chapters[index - 1].start;
    const end = libraryItem.media.chapters[index - 1].end;
    return [start, end];
  } catch (error) {
    console.error("Error calculating chapter:", error, {
      title: libraryItem.media.metadata.title,
      id: libraryItem.id,
      chapters: libraryItem.media.chapters,
      index,
    });
    return [0, 0];
  }
};
