import { FontAwesome, FontAwesome6, Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import { eq } from "drizzle-orm";
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
import TrackPlayer, {
  State,
  useActiveTrack,
  usePlaybackState,
} from "react-native-track-player";

import { localDb } from "@/db";
import {
  LibraryItemAudioFileSchemaType,
  LibraryItemEBookFileSchemaType,
  libraryItemSchema,
  LibraryItemSchemaType,
} from "@/db/schema";
import { handleDownload, useDownloadStore } from "@/stores/downloadStore";
import { useMediaStore } from "@/stores/mediaStore";

export default function Media() {
  const { id } = useLocalSearchParams();

  const mediaStore = useMediaStore();

  useFocusEffect(
    useCallback(() => {
      mediaStore.refetch(id as string);
    }, [id]),
  );

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      {mediaStore.libraryItem && mediaStore.audioFiles && (
        <View className="flex h-screen gap-2 bg-slate-800 p-2">
          <TopActionsBar />
          <View className="flex flex-row gap-2">
            <MediaArt libraryItem={mediaStore.libraryItem} />
            <MediaActionsBar
              libraryItem={mediaStore.libraryItem}
              audioFiles={mediaStore.audioFiles}
              ebook={mediaStore.ebook}
            />
          </View>
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

const MediaArt = ({ libraryItem }: { libraryItem: LibraryItemSchemaType }) => {
  return (
    <View className="flex flex-row gap-2">
      <View className="h-[250px] w-[250px] overflow-hidden rounded-lg">
        <Image
          source={libraryItem.coverArtPath}
          contentFit="fill"
          transition={300}
          style={{ width: 250, height: 250 }}
        />
      </View>

      {/* <View className="flex justify-end">
        
        <Text className="text-lg font-bold text-white">
          {libraryItem.title}
        </Text>
        
        <Text className="text-lg text-stone-400">
          {libraryItem.publishedYear} * 1hr 25m * TV-PG
        </Text>
        <Text className="text-stone-400">GoodReads rating</Text>
      </View> */}
    </View>
  );
};

const MediaActionsBar = ({
  libraryItem,
  audioFiles,
  ebook,
}: {
  libraryItem: LibraryItemSchemaType;
  audioFiles: LibraryItemAudioFileSchemaType[];
  ebook: LibraryItemEBookFileSchemaType | null;
}) => {
  const { state: playbackState } = usePlaybackState();
  const activeTrack = useActiveTrack();
  const downloadStore = useDownloadStore();

  const handleRead = async () => {
    await localDb
      .update(libraryItemSchema)
      .set({ lastEBookId: ebook?.id })
      .where(eq(libraryItemSchema.id, libraryItem.id));
    router.push(`/(reader)/${libraryItem.id}`);
  };

  return (
    <View className="flex flex-1 items-center gap-2">
      {/* downloadable view */}
      {!downloadStore.isDownloading(libraryItem.id) &&
        audioFiles.filter((a) => a.path).length === 0 &&
        ebook?.path === null && (
          <Pressable
            onPress={() => handleDownload(libraryItem.id)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-300 py-2">
            <View className="animate-bounce">
              <Ionicons name="cloud-download-outline" size={24} color="white" />
            </View>
          </Pressable>
        )}

      {/* downloading view */}
      {downloadStore.isDownloading(libraryItem.id) && (
        <View className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-300 py-2">
          <View className="animate-spin">
            <FontAwesome6 name="circle-notch" size={24} color="white" />
          </View>
        </View>
      )}

      {/* Buttons to show after downloaded */}
      {!downloadStore.isDownloading(libraryItem.id) && (
        <>
          {(playbackState !== State.Playing ||
            !audioFiles.find((af) => af.id === activeTrack?.id)) &&
            audioFiles.filter((a) => a.path).length > 0 && (
              <Pressable
                onPress={() => {
                  TrackPlayer.play();
                  router.push(`/(player)/${libraryItem.id}`);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-300 py-2">
                <Ionicons name="play-sharp" size={40} color="white" />
              </Pressable>
            )}

          {playbackState === State.Playing &&
            audioFiles.find((af) => af.id === activeTrack?.id) && (
              <Pressable
                onPress={() => TrackPlayer.pause()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-300 py-2">
                <Ionicons name="pause" size={40} color="white" />
              </Pressable>
            )}

          {ebook && ebook.path && (
            <Pressable
              onPress={() => handleRead()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-300 py-2">
              <Text className="text-3xl font-bold text-white">Read</Text>
            </Pressable>
          )}

          {/* TODO: add actions that make sense, like add to reading queue/bookmark, download, mark as read */}
          {/* TODO: need to work out sheet that slides up to reveal options */}
          <Pressable
            onPress={() => router.push("/(media)/modal")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 py-2">
            <FontAwesome6 name="ellipsis" size={24} color="white" />
          </Pressable>
        </>
      )}
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
          <Text className="text-stone-300">{libraryItem.authorNameLF}</Text>
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
          {audioFiles?.map((audioFile, i) => (
            <View
              key={audioFile.id}
              onLayout={(e) => {
                if (libraryItem.lastPlayedId === audioFile.id) {
                  tracksScrollViewRef.current?.scrollTo({
                    y: e.nativeEvent.layout.y - 10,
                  });
                }
              }}>
              <Chapter
                audioFile={audioFile}
                isLastPlayed={libraryItem.lastPlayedId === audioFile.id}
              />
            </View>
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
      href={{
        pathname: "/(player)/[id]",
        params: { id: audioFile.libraryItemId, audioFileId: audioFile.id },
      }}
      asChild>
      <Pressable className="relative flex w-full">
        <View
          // className={`m-1 flex flex-row justify-between gap-2 rounded p-4 ${libraryItem.lastPlayedId === audioFile.id ? "bg-sky-300" : "bg-slate-400/30"}`}
          className={clsx(
            "flex w-full flex-row items-center justify-between gap-4 rounded-t p-2 py-4",
            {
              "bg-slate-400/30 opacity-35": !isLastPlayed && audioFile.complete,
              "bg-slate-400/30": !isLastPlayed && !audioFile.complete,
              "bg-sky-300": isLastPlayed,
            },
          )}>
          <Text
            className={clsx("w-4/5 font-bold", {
              "text-slate-800": isLastPlayed,
              "text-white": !isLastPlayed,
            })}>
            {audioFile.name}
          </Text>

          {audioFile.path && audioFile.complete && (
            <View className="p-2">
              <FontAwesome6 name="circle-check" size={24} color="white" />
            </View>
          )}
          {audioFile.path && !audioFile.complete && (
            <View className="px-2">
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
      </Pressable>
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
