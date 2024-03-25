import { eq } from "drizzle-orm";
import { Pressable, SafeAreaView, Text, View } from "react-native";

import { dropDatabase, localDb } from "@/db";
import {
  libraryItemAudioFileSchema,
  libraryItemSchema,
  librarySchema,
} from "@/db/schema";
import { getLibraries } from "@/services/libraryApi";
import { getLibraryItem } from "@/services/libraryItemApi";
import { getLibraryItems } from "@/services/libraryItemsApi";

export default function Settings() {
  const handleSync = async () => {
    console.log("syncing with server");
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
        if (!libraryItemId) {
          console.log("adding library item");
          const result = await localDb.insert(libraryItemSchema).values({
            title: item.media.metadata.title,
            authorName: item.media.metadata.authorName,
            duration: item.media.duration,
            numAudioFiles: item.media.numAudioFiles,
            description: item.media.metadata.description,
            // publishedYear: item.media.metadata.publishedYear,
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
  };

  const handleDropData = () => {
    dropDatabase();
  };

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen gap-4 bg-slate-800 p-4">
        <Pressable
          onPress={handleSync}
          className="flex w-full items-center justify-center rounded bg-sky-300 px-4 py-2">
          <Text className="text-2xl text-white">Sync</Text>
        </Pressable>

        <Pressable
          onPress={handleDropData}
          className="flex w-full items-center justify-center rounded bg-red-300 px-4 py-2">
          <Text className="text-2xl text-white">Drop data</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
