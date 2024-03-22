import { Pressable, SafeAreaView, Text, View } from "react-native";

import { localDb } from "@/db";
import { libraryItemSchema, librarySchema } from "@/db/schema";
import { getLibraries } from "@/services/libraryApi";
import { getLibraryItems } from "@/services/libraryItemApi";

export default function Settings() {
  const handleSync = async () => {
    console.log("syncing with server");
    const libraries = await getLibraries();
    for (const library of libraries) {
      const result = await localDb
        .insert(librarySchema)
        .values({ name: library.name })
        .returning({ insertedId: librarySchema.id });
      console.log("library " + library.name);
      const items = await getLibraryItems(library.id);
      // filter down to audiobooks
      const audiobookItems = items.filter(
        (item) => item.media.numAudioFiles > 0,
      );
      for (const item of audiobookItems) {
        console.log(
          "item " +
            item.media.metadata.title +
            " audiofiles" +
            item.media.numAudioFiles,
        );
        await localDb.insert(libraryItemSchema).values({
          title: item.media.metadata.title,
          authorName: item.media.metadata.authorName,
          libraryId: result[0].insertedId,
          duration: item.media.duration,
          numAudioFiles: item.media.numAudioFiles,
        });
      }
    }
  };
  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen bg-slate-800 p-4">
        <Pressable
          onPress={handleSync}
          className="flex w-full items-center justify-center rounded bg-sky-300 px-4 py-2">
          <Text className="text-2xl text-white">Sync</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
