import { FontAwesome, FontAwesome6, Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import { Image } from "expo-image";
import {
  Link,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import {
  LibraryItemAudioFileSchemaType,
  LibraryItemSchemaType,
} from "@/db/schema";
import { useMediaStore } from "@/stores/mediaStore";

export default function Media() {
  const { id } = useLocalSearchParams();

  const mediaStore = useMediaStore();

  useFocusEffect(
    useCallback(() => {
      mediaStore.refetch(parseInt(id as string, 10));
    }, []),
  );

  const handleDownload = async () => {
    Toast.show({
      type: "info",
      text1: "Downloading audio files",
      position: "bottom",
    });
    await mediaStore.downloadAudioFiles();
    Toast.show({
      type: "success",
      text1: "Downloaded audio files",
      position: "bottom",
    });
  };

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      {mediaStore.libraryItem && mediaStore.audioFiles && (
        <View className="flex h-screen gap-2 bg-slate-800 p-2">
          <TopActionsBar />
          <MediaArtAndImportantInfo libraryItem={mediaStore.libraryItem} />
          <MediaActionsBar
            libraryItem={mediaStore.libraryItem}
            handleDownload={handleDownload}
            isDownloading={mediaStore.isDownloading}
            audioFiles={mediaStore.audioFiles}
          />
          <MediaSummary libraryItem={mediaStore.libraryItem} />
          {mediaStore.audioFiles && (
            <MediaTracks
              libraryItem={mediaStore.libraryItem}
              audioFiles={mediaStore.audioFiles}
            />
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
      <View className="flex h-60 w-36">
        <Image
          key={libraryItem.id}
          source={libraryItem.coverArtPath}
          style={{ flex: 1 }}
          contentFit="cover"
          transition={1000}
        />
      </View>
      <View className="flex justify-end">
        {/* TODO: figure out how to wrap text, usual tricks ain't working */}
        <Text className="text-lg font-bold text-white">
          {libraryItem.title}
        </Text>
        {/* TODO: complete */}
        <Text className="text-lg text-stone-400">
          {libraryItem.publishedYear} * 1hr 25m * TV-PG
        </Text>
        <Text className="text-stone-400">GoodReads rating</Text>
      </View>
    </View>
  );
};

const MediaActionsBar = ({
  libraryItem,
  handleDownload,
  isDownloading,
  audioFiles,
}: {
  libraryItem: LibraryItemSchemaType;
  handleDownload: () => void;
  isDownloading: boolean;
  audioFiles: LibraryItemAudioFileSchemaType[];
}) => {
  return (
    <View className="flex flex-row items-center justify-between">
      {/* TODO: Looks like Plex is using css grid to have 4 squares, the first col taking up a little over 1/3. This causes the art poster and play button to align */}
      {isDownloading === false &&
        audioFiles.filter((a) => a.path).length > 0 && (
          <Link href={`/(player)/${libraryItem.id}`}>
            <View className="flex h-14 w-48 flex-row items-center justify-center gap-2 rounded-lg bg-sky-300 py-2">
              <Ionicons name="play-sharp" size={40} color="white" />
            </View>
          </Link>
        )}

      {isDownloading === false &&
        audioFiles.filter((a) => a.path).length === 0 && (
          <View className="flex h-14 w-48 flex-row items-center justify-center gap-2 rounded-lg bg-sky-300 py-2">
            <View className="animate-bounce">
              <Ionicons
                name="cloud-download-outline"
                size={24}
                color="white"
                onPress={handleDownload}
              />
            </View>
          </View>
        )}

      {isDownloading && (
        <View className="flex h-14 w-48 flex-row items-center justify-center gap-2 rounded-lg bg-sky-300 py-2">
          <View className="animate-spin">
            <FontAwesome6 name="circle-notch" size={24} color="white" />
          </View>
        </View>
      )}

      <View className="ml-auto mr-2 flex flex-row items-center justify-end gap-4">
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
          <Text className="text-stone-300">{libraryItem.publishedYear}</Text>
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
  const tracksScrollViewRef = useRef<ScrollView>(null);
  return (
    <View className="mt-4">
      <View className="flex flex-row justify-between">
        <Text className="uppercase text-white">Chapters</Text>
        <Text className="text-stone-300">
          {audioFiles?.filter((a) => !a.complete).length}/{audioFiles?.length}{" "}
          remaining
        </Text>
      </View>

      <ScrollView ref={tracksScrollViewRef}>
        <View className="my-2 flex gap-2">
          {audioFiles?.map((audioFile) => (
            <Chapter
              key={audioFile.id}
              audioFile={audioFile}
              isLastPlayed={libraryItem.lastPlayedId === audioFile.id}
            />
          ))}
        </View>

        <View className="flex items-center justify-center pb-[600px]">
          <Pressable
            onPress={() => tracksScrollViewRef.current?.scrollTo({ y: 0 })}
            className="mt-8">
            <FontAwesome name="arrow-circle-up" size={48} color="white" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const Chapter = ({
  audioFile,
  isLastPlayed,
}: {
  audioFile: LibraryItemAudioFileSchemaType;
  isLastPlayed: boolean;
}) => {
  return (
    <Link
      disabled={!audioFile.path}
      href={`/(player)/${audioFile.libraryItemId}?audioFileId=${audioFile.id}`}>
      <View className="relative flex w-full">
        <View
          // className={`m-1 flex flex-row justify-between gap-2 rounded p-4 ${libraryItem.lastPlayedId === audioFile.id ? "bg-sky-300" : "bg-slate-400/30"}`}
          className={clsx(
            "flex h-20 w-full flex-row items-center justify-between gap-4 rounded-t p-2",
            {
              "bg-slate-400/30 opacity-35": !isLastPlayed && audioFile.complete,
              "bg-slate-400/30": !isLastPlayed && !audioFile.complete,
              "bg-sky-300": isLastPlayed,
            },
          )}>
          <Text
            className={clsx("flex-wrap text-wrap font-bold", {
              "text-slate-800": isLastPlayed,
              "text-white": !isLastPlayed,
            })}>
            {audioFile.name}
          </Text>

          {/* TODO: figure out how to prevent this icon from shrinking and flowing out of the card */}
          {audioFile.path && audioFile.complete && (
            <View className="flex-shrink-0 p-2">
              <FontAwesome6 name="circle-check" size={24} color="white" />
            </View>
          )}
          {audioFile.path && !audioFile.complete && (
            <View className="flex-shrink-0 px-2">
              <FontAwesome6 name="circle-play" size={24} color="white" />
            </View>
          )}
        </View>
        <View
          className="absolute bottom-0 h-1 rounded-b bg-yellow-300"
          style={{
            width: `${calc(audioFile.progress ?? 1, audioFile.duration)}%`,
          }}
        />
      </View>
    </Link>
  );
};

// TODO: move to central place
export const calc = (position: number, duration: number) => {
  // TODO: for some reason math.round returns 100%???
  // const result = Math.round(position / duration) * 100;
  const result = (position / duration) * 100;
  return parseInt(result.toFixed(2), 10);
};
