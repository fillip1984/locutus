import { asc, eq } from "drizzle-orm";
import { create } from "zustand";

import { db } from "@/db";
import {
  audioChapterSchema,
  ebookSchema,
  libraryItemSchema,
  libraryItemSchemaType,
  libraryItemSeriesSchema,
  librarySchema,
  librarySchemaType,
  newAudioChapterType,
  seriesSchema,
} from "@/db/schema";
import { downloadCoverArt } from "@/services/coverArtApi";
import { getLibraries } from "@/services/libraryApi";
import { Chapter, getLibraryItem } from "@/services/libraryItemApi";
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
        // download cover art
        const coverArtPath = await downloadCoverArt(remoteItem.id);
        const libraryItemValues = {
          remoteId: remoteItem.id,
          title: remoteItem.media.metadata.title,
          subtitle: remoteItem.media.metadata.subtitle,
          authorName: remoteItem.media.metadata.authorName,
          authorNameLF: remoteItem.media.metadata.authorNameLF,
          publishedYear: remoteItem.media.metadata.publishedYear
            ? parseInt(remoteItem.media.metadata.publishedYear)
            : null,
          description: remoteItem.media.metadata.description,
          isbn: remoteItem.media.metadata.isbn,
          asin: remoteItem.media.metadata.asin,
          coverArtPath,
          isAudiobook: remoteItem.media.numAudioFiles > 0,
          // TODO: check that this works!!!
          isEbook: !!remoteItem.media.ebookFormat,
          libraryId: remoteLibrary.id,
        };

        const libraryItem = await db
          .insert(libraryItemSchema)
          .values(libraryItemValues)
          .onConflictDoUpdate({
            target: [libraryItemSchema.remoteId, libraryItemSchema.libraryId],
            set: libraryItemValues,
          })
          .returning({ id: libraryItemSchema.id });
        const localLibraryItemId = libraryItem[0].id;

        const remoteLibraryItem = await getLibraryItem(remoteItem.id);
        if (!remoteLibraryItem) {
          console.error(
            `Failed to fetch library item with id: ${remoteItem.id} after syncing libraries, skipping syncing related audio and ebook files for this item`,
          );
          continue;
        }

        // ebook/audio synchronization
        if (remoteLibraryItem?.media.ebookFile) {
          const ebook = remoteLibraryItem.media.ebookFile;
          const ebookValues = {
            remoteId: ebook.ino,
            name: ebook.metadata.filename,
            ebookFormat: ebook.metadata.ext,
            libraryItemId: localLibraryItemId,
          };
          await db.insert(ebookSchema).values(ebookValues).onConflictDoUpdate({
            target: ebookSchema.remoteId,
            set: ebookValues,
          });
        }

        // build then save chapters
        const chapterList: newAudioChapterType[] = [];
        let chapterCounter = 0;
        for (const audioFile of remoteLibraryItem.media.audioFiles ?? []) {
          const chapters: Chapter[] =
            audioFile.chapters.length > 0
              ? audioFile.chapters
              : [remoteLibraryItem.media.chapters[chapterCounter]];

          for (const chapter of chapters) {
            try {
              chapterList.push({
                index: chapterList.length,
                title: chapter.title,
                start: Math.round(chapter.start * 1000) / 1000,
                end: Math.round(chapter.end * 1000) / 1000,
                mediaRemoteId: audioFile.ino,
                mediaFormat: audioFile.metadata.ext,
                duration:
                  Math.round((chapter.end - chapter.start) * 1000) / 1000,
                libraryItemId: localLibraryItemId,
              });
            } catch (error) {
              console.error(
                `Failed to sync chapter for library item ${remoteLibraryItem.media.metadata.title}`,
                error,
              );
            }
          }
          chapterCounter++;
        }

        chapterList.forEach((chapter, index) => {
          chapter.index = index;
        });

        for (const chapter of chapterList) {
          await db
            .insert(audioChapterSchema)
            .values(chapter)
            .onConflictDoUpdate({
              target: [
                audioChapterSchema.index,
                audioChapterSchema.libraryItemId,
              ],
              set: chapter,
            });
        }

        // update total duration
        if (remoteLibraryItem.media.chapters?.length > 0) {
          await db
            .update(libraryItemSchema)
            .set({
              audiobookDuration:
                Math.round(
                  remoteLibraryItem.media.chapters[
                    remoteLibraryItem.media.chapters.length - 1
                  ].end * 1000,
                ) / 1000,
            })
            .where(eq(libraryItemSchema.id, localLibraryItemId));
        }

        // build then save series
        if (remoteLibraryItem.media.metadata.series.length > 0) {
          const series = remoteLibraryItem.media.metadata.series
            .filter((s) => s.sequence)
            .map((s) => {
              return {
                remoteId: s.id,
                sequence: s.sequence ? parseInt(s.sequence) : null,
                name: s.name,
              };
            });

          for (const seriesEntry of series) {
            const seriesId = (
              await db
                .insert(seriesSchema)
                .values(seriesEntry)
                .onConflictDoUpdate({
                  target: [seriesSchema.remoteId],
                  set: seriesEntry,
                })
                .returning({ id: seriesSchema.id })
            )[0].id;

            const libraryItemSeriesValues = {
              libraryItemId: localLibraryItemId,
              seriesId,
              sequence: seriesEntry.sequence,
            };
            await db
              .insert(libraryItemSeriesSchema)
              .values(libraryItemSeriesValues)
              .onConflictDoUpdate({
                target: [
                  libraryItemSeriesSchema.libraryItemId,
                  libraryItemSeriesSchema.seriesId,
                ],
                set: libraryItemSeriesSchema,
              });
          }
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
