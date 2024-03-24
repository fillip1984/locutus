import { FontAwesome, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { localDb } from "@/db";
import {
  LibraryItemAudioFileSchemaType,
  LibraryItemSchemaType,
  libraryItemAudioFileSchema,
  libraryItemSchema,
} from "@/db/schema";
import { downloadLibraryItem } from "@/services/libraryItemApi";

export default function Media() {
  const { id } = useLocalSearchParams();
  const [libraryItem, setLibraryItem] = useState<
    LibraryItemSchemaType | null | undefined
  >(null);
  const [audioFiles, setAudioFiles] = useState<
    LibraryItemAudioFileSchemaType[] | null
  >();

  useEffect(() => {
    const fetchData = async () => {
      const result = await localDb
        .select()
        .from(libraryItemSchema)
        .where(eq(libraryItemSchema.id, parseInt(id as string, 10)));
      setLibraryItem(result[0]);

      const audioResults = await localDb
        .select()
        .from(libraryItemAudioFileSchema)
        .where(
          eq(
            libraryItemAudioFileSchema.libraryItemId,
            parseInt(id as string, 10),
          ),
        );
      setAudioFiles(audioResults);
      // TODO: figure this out
      // const result = localDb.query.libraryItemSchema.findFirst({
      //   where: (libraryItemSchema, { eq }) =>
      //     eq(libraryItemSchema.id, parseInt(id as string, 10)),
      //   with: { libraryItemAudioFileSchema: true },
      // });
      // setLibraryItem(result);
    };

    fetchData();
  }, [id]);

  const handleDownload = async (libraryItemId: string, fileId: string) => {
    console.log("downloading");
    if (fileId === "*" && audioFiles) {
      // TODO: download them all, right now just doing one
      const file = await downloadLibraryItem(
        libraryItemId,
        audioFiles[0].remoteId,
      );
      await localDb
        .update(libraryItemAudioFileSchema)
        .set({ path: file })
        .where(eq(libraryItemAudioFileSchema.remoteId, audioFiles[0].remoteId));
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      {libraryItem && (
        <View className="flex h-screen gap-2 bg-slate-800 p-2">
          <TopActionsBar />
          <MediaArtAndImportantInfo libraryItem={libraryItem} />
          <MediaActionsBar
            libraryItem={libraryItem}
            handleDownload={handleDownload}
          />
          <MediaSummary libraryItem={libraryItem} />
          {audioFiles && (
            <MediaTracks libraryItem={libraryItem} audioFiles={audioFiles} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const TopActionsBar = () => {
  return (
    <View>
      <Pressable onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={32} color="white" />
      </Pressable>
    </View>
  );
};

// cloned from flex page shown after selecting a movie
const MediaArtAndImportantInfo = ({
  libraryItem,
}: {
  libraryItem: LibraryItemSchemaType;
}) => {
  return (
    <View className="flex flex-row gap-2">
      <View className="flex h-48 w-48 items-center justify-center rounded-lg bg-stone-400">
        <Text>ABC</Text>
      </View>
      <View className="flex justify-end">
        {/* TODO: figure out how to wrap text, usual tricks ain't working */}
        <Text className="text-lg font-bold text-white">
          {libraryItem.title}
        </Text>
        <Text className="text-lg text-stone-400">2024 * 1hr 25m * TV-PG</Text>
        <Text className="text-stone-400">GoodReads rating</Text>
      </View>
    </View>
  );
};

const MediaActionsBar = ({
  libraryItem,
  handleDownload,
}: {
  libraryItem: LibraryItemSchemaType;
  handleDownload: (libraryItemId: string, fileId: string) => void;
}) => {
  return (
    <View className="flex flex-row items-center justify-between">
      {/* main button */}
      {/* TODO: Looks like Plex is using css grid to have 4 squares, the first col taking up a little over 1/3. This causes the art poster and play button to align */}
      <Link href={`/(player)/${libraryItem.id}`}>
        <View className="flex w-48 flex-row items-center justify-center gap-2 rounded-lg bg-sky-300 py-2">
          <Ionicons name="play-sharp" size={40} color="white" />
          <Text className="text-2xl font-bold text-white">Play</Text>
        </View>
      </Link>
      {/* other menu items */}
      <View className="mr-2 flex flex-row items-center gap-4">
        <Ionicons
          name="cloud-download-outline"
          size={24}
          color="white"
          onPress={() => handleDownload(libraryItem.remoteId, "*")}
        />
        {/* TODO: add actions that make sense, like add to reading queue/bookmark, download, mark as read */}
        {/* TODO: need to work out sheet that slides up to reveal options */}
        <Link href="/(media)/modal" asChild>
          <FontAwesome6 name="ellipsis" size={24} color="white" />
        </Link>
      </View>
    </View>
  );
};

const MediaSummary = ({
  libraryItem,
}: {
  libraryItem: LibraryItemSchemaType;
}) => {
  return (
    <View className="mt-4">
      <Text className="line-clamp-6 text-stone-300">
        {libraryItem.description}
      </Text>

      {/* TODO: looks like more CSS GRID would be a better fit here as well */}
      <View className="mt-4">
        <View className="flex flex-row items-center gap-4">
          <Text className="uppercase text-stone-400">AUTHOR</Text>
          <Text className="text-stone-300">{libraryItem.authorName}</Text>
        </View>
        <View className="flex flex-row items-center gap-4">
          <Text className="uppercase text-stone-400">PUBLISHED</Text>
          <Text className="text-stone-300">December 25, 2022</Text>
        </View>
      </View>
    </View>
  );
};

const MediaTracks = ({
  libraryItem,
  audioFiles,
}: {
  libraryItem: LibraryItemSchemaType;
  audioFiles: LibraryItemAudioFileSchemaType[];
}) => {
  return (
    <View className="mt-4">
      <View className="flex flex-row justify-between">
        <Text className="uppercase text-white">Chapters</Text>
        <Text className="text-stone-300">{audioFiles?.length} unwatched</Text>
      </View>

      <ScrollView>
        {audioFiles?.map((audioFile) => (
          <View
            key={audioFile.id}
            className="m-1 flex flex-row justify-between gap-2 rounded bg-slate-400/30 p-4">
            <Text className="text-white">{audioFile.name}</Text>
            {/* <Text className="text-white">43:12</Text> */}
            <FontAwesome6 name="circle-play" size={24} color="white" />
          </View>
        ))}
        <View className="flex items-center justify-center pb-[600px]">
          <Pressable className="mt-8">
            <FontAwesome name="arrow-circle-up" size={48} color="white" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};
