import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNowPlaying } from "react-native-nitro-player";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Link,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import {
  FontAwesome,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { eq } from "drizzle-orm";

import { colors } from "@/components/ui/colors";
import CoverArt from "@/components/ui/cover-art";
import { generateGradientFromImageUrl } from "@/components/ui/graident-colors";
import { db } from "@/db";
import {
  audioChapterSchemaType,
  libraryItemSchema,
  libraryItemWithFilesSchemaType,
} from "@/db/schema";
import {
  calculateDurationPercentage,
  formatSecondsToTime,
} from "@/services/progressService";
import { handleDownload, useDownloadStore } from "@/stores/download-store";
import { useLibraryStore } from "@/stores/library-store";

export default function MediaPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [libraryItem, setLibraryItem] =
    useState<libraryItemWithFilesSchemaType | null>(null);
  const { status: libraryStatus } = useLibraryStore();

  useFocusEffect(
    useCallback(() => {
      const fetchLibraryItem = async () => {
        const result = await db.query.libraryItemSchema.findFirst({
          where: {
            id,
          },
          with: {
            audioChapters: true,
            ebook: true,
          },
        });
        if (result) {
          setLibraryItem(result);
        } else {
          setLibraryItem(null);
        }
      };

      // libraryStatus check is necessary for file download, after it completes downloading this is what triggers a reload of library item media
      if (id || libraryStatus === "loaded") {
        // console.log("Fetching library item with id:", id);
        fetchLibraryItem();
      }
    }, [id, libraryStatus]),
  );

  // gradient colors for the background, default to background color
  const [gradientColors, setGradientColors] = useState<[string, string]>([
    colors.background,
    colors.background,
  ]);

  useEffect(() => {
    let isCancelled = false;

    async function loadGradient() {
      // console.log("Generating gradient for", libraryItem?.coverArtPath);

      if (!libraryItem?.coverArtPath) {
        // console.log("No cover art path, using default gradient");
        setGradientColors([colors.background, colors.background]);
        return;
      }

      const gradient = await generateGradientFromImageUrl(
        libraryItem.coverArtPath,
      );
      if (!isCancelled) {
        // console.log("Generated gradient", gradient);
        setGradientColors(gradient.colors);
      }
    }

    loadGradient();

    return () => {
      isCancelled = true;
    };
  }, [libraryItem?.coverArtPath]);

  const [expandDescription, setExpandDescription] = useState(false);

  const tracksScrollViewRef = useRef<ScrollView>(null);
  const scrollToTop = () => {
    tracksScrollViewRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  };

  // empty view
  if (!libraryItem) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <View className="mx-auto my-2 h-1 w-10 rounded-full bg-white"></View>
          <Text className="text-4xl font-bold text-white">Media not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView ref={tracksScrollViewRef}>
          <View className="flex-1 gap-1">
            <View className="mx-auto my-2 h-1 w-10 rounded-full bg-white"></View>
            <CoverArt coverArtPath={libraryItem.coverArtPath} />
            <View className="px-2">
              <Text className="text-2xl font-bold text-white">
                {libraryItem.title}
              </Text>
              <Text className="text-lg text-white/80">
                {libraryItem.authorName}
              </Text>
              <Text className="text-white/80">{libraryItem.publishedYear}</Text>
              <Controls libraryItem={libraryItem} />
              {/* TODO: https://docs.swmansion.com/react-native-reanimated/examples/accordion */}
              <Text
                className={`mt-1 tracking-tighter text-white ${expandDescription ? "" : "line-clamp-6"}`}
                onPress={() => setExpandDescription((prev) => !prev)}
              >
                {hideHtmlTags(libraryItem.description ?? "")}
              </Text>
              {libraryItem.audioChapters &&
                libraryItem.audioChapters.length > 0 && (
                  <MediaTracks libraryItem={libraryItem} />
                )}
              <Series />

              {/* scroll to top */}
              <View className="flex items-center justify-center pb-24">
                <Pressable onPress={scrollToTop} className="mt-8">
                  <FontAwesome6 name="arrow-up-long" size={48} color="white" />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const Controls = ({
  libraryItem,
}: {
  libraryItem: libraryItemWithFilesSchemaType;
}) => {
  const { currentTrack, currentState } = useNowPlaying();
  const downloadStore = useDownloadStore();

  const [isPlayable, setIsPlayable] = useState(false);
  const [isResumable, setIsResumable] = useState(false);
  const [isReadable, setIsReadable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);

  useEffect(() => {
    if (!libraryItem) return;
    setIsResumable(
      libraryItem.id === currentTrack?.extraPayload?.libraryItemId &&
        currentState === "playing",
    );
    setIsPlayable(
      !isResumable && libraryItem.isAudiobook && libraryItem.downloaded,
    );
    setIsReadable(libraryItem.isEbook && libraryItem.downloaded);
    setIsDownloading(downloadStore.isDownloading(libraryItem.id ?? ""));
    setIsDownloadable(
      !downloadStore.isDownloading(libraryItem.id) &&
        !libraryItem.downloaded &&
        (libraryItem.isAudiobook || libraryItem.isEbook),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentState,
    currentTrack,
    libraryItem,
    downloadStore,
    downloadStore.isDownloading,
  ]);

  // toggle complete/unread status for the library item and audio files
  const [readStatus, setReadStatus] = useState<"complete" | "unread">(
    libraryItem.complete ? "complete" : "unread",
  );
  const handleToggleCompleteOrUnread = async () => {
    const newReadStatus = readStatus === "complete" ? "unread" : "complete";
    // TODO: this should be done in a transaction
    await db
      .update(libraryItemSchema)
      .set({
        updatedAt: new Date(),
        audiobookLocation:
          newReadStatus === "complete" ? libraryItem.audiobookDuration : 0,
        audiobookProgress: newReadStatus === "complete" ? 100 : 0,
        complete: newReadStatus === "complete" ? true : false,
      })
      .where(eq(libraryItemSchema.id, libraryItem.id));

    // const audioFiles = await db.query.audioChapterSchema.findMany({
    //   where: {
    //     libraryItemId: libraryItem.id,
    //   },
    // });
    // for (const audioFile of audioFiles) {
    //   await db
    //     .update(audioChapterSchema)
    //     .set({
    //       complete: newReadStatus === "complete" ? true : false,
    //       progress: newReadStatus === "complete" ? audioFile.duration : 0,
    //     })
    //     .where(eq(audioChapterSchema.id, audioFile.id));
    // }
    setReadStatus(newReadStatus);
  };

  return (
    <View className="my-4 flex-row items-center gap-4">
      {isDownloadable ? (
        <TouchableOpacity
          onPress={() => handleDownload(libraryItem.id)}
          className="flex h-16 w-full flex-row items-center justify-center gap-2 rounded-full bg-white py-2"
        >
          <FontAwesome6 name="cloud-arrow-down" size={24} color="black" />
          <Text className="text-lg font-semibold text-black">Download</Text>
        </TouchableOpacity>
      ) : isDownloading ? (
        <TouchableOpacity className="flex h-16 w-full flex-row items-center justify-center gap-2 rounded-full bg-white/20 py-4">
          <Text className="font-semibold text-white">Downloading...</Text>
        </TouchableOpacity>
      ) : isPlayable || isResumable ? (
        <View className="flex w-full gap-4">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: `/player/[id]`,
                params: {
                  id: libraryItem.id,
                  audiobookLocation: libraryItem.audiobookLocation,
                  mode: isResumable ? "resume" : "play",
                },
              })
            }
            className="flex h-16 w-full items-center justify-center rounded-full bg-white py-2"
          >
            <View className="flex-row items-center justify-center gap-1">
              <FontAwesome6 name="play" size={24} color="black" />
              <Text className="text-lg text-black/80">
                {isResumable ? "Resume" : "Play"}
              </Text>
            </View>
            {!libraryItem.complete && (
              <>
                <View className="flex-row items-center justify-center gap-1">
                  <MaterialCommunityIcons
                    name="progress-clock"
                    size={24}
                    color="black"
                    style={{ opacity: 0.5 }}
                  />
                  <Text className="text-sm text-black/50">
                    {`${formatSecondsToTime((libraryItem.audiobookDuration ?? 0) - (libraryItem.audiobookLocation ?? 0), "duration")} | ${Math.trunc(100 - (libraryItem.audiobookProgress ?? 0))}% remaining`}
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
          <View className="w-full flex-row items-center justify-around">
            {/* <TouchableOpacity className="flex w-12 items-center justify-center gap-1">
              <View className="flex size-12 items-center justify-center rounded-full bg-white/10 p-1">
                <FontAwesome6 name="heart" size={16} color="white" />
              </View>
              <Text className="text-center text-[10px] text-white">
                Add to Favorites
              </Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              onPress={handleToggleCompleteOrUnread}
              className="flex w-12 items-center justify-center gap-1"
            >
              <View className="flex size-12 items-center justify-center rounded-full bg-white/10 p-1">
                {readStatus === "complete" ? (
                  <FontAwesome name="check-circle-o" size={20} color="white" />
                ) : (
                  <FontAwesome name="check-circle" size={20} color="white" />
                )}
              </View>
              <Text className="text-center text-[10px] text-white">
                {readStatus === "complete"
                  ? "Mark as Unread"
                  : "Mark as Complete"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-12 items-center justify-center gap-1">
              <View className="flex size-12 items-center justify-center rounded-full bg-white/10 p-1">
                <FontAwesome6
                  name="ellipsis-vertical"
                  size={16}
                  color="white"
                />
              </View>
              <Text className="text-center text-[10px] text-white">More</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isReadable ? (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: `/reader/[id]`,
              params: {
                id: libraryItem.id,
                eBookFileId: libraryItem.ebook?.remoteId,
                mode: "read",
              },
            })
          }
          className="flex w-full flex-row items-center justify-center rounded-full bg-white/10 px-4 py-4"
        >
          <Text className="font-semibold text-white/50">Read</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          disabled
          className="flex w-full flex-row items-center justify-center rounded-full bg-white/10 px-4 py-4"
        >
          <Text className="font-semibold text-white/30">
            No media available
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const MediaTracks = ({
  libraryItem,
}: {
  libraryItem: libraryItemWithFilesSchemaType;
}) => {
  return (
    <View className="mt-4">
      <View className="flex flex-row justify-between">
        <Text className="text-white uppercase">Chapters</Text>
        <Text className="text-stone-300">
          {
            libraryItem.audioChapters?.filter((a) =>
              libraryItem.audiobookLocation
                ? a.end > libraryItem.audiobookLocation
                : true,
            ).length
          }
          /{libraryItem.audioChapters?.length} remaining
        </Text>
      </View>

      <View className="my-2 flex gap-2">
        {libraryItem.audioChapters?.map((audioChapter, i) => (
          <Chapter
            key={audioChapter.id}
            libraryItem={libraryItem}
            audioChapter={audioChapter}
          />
        ))}
      </View>
    </View>
  );
};

const Chapter = ({
  audioChapter,
  libraryItem,
}: {
  audioChapter: audioChapterSchemaType;
  libraryItem: libraryItemWithFilesSchemaType;
}) => {
  const isLastPlayed = libraryItem.audiobookLocation
    ? audioChapter.end > libraryItem.audiobookLocation &&
      audioChapter.start < libraryItem.audiobookLocation
    : false;
  const complete = libraryItem.audiobookLocation
    ? audioChapter.end < libraryItem.audiobookLocation
    : false;

  return (
    <Link
      disabled={!libraryItem.downloaded}
      href={{
        pathname: "/player/[id]",
        params: {
          id: audioChapter.libraryItemId,
          audiobookLocation: audioChapter.start,
          mode: isLastPlayed ? "resume" : "play",
        },
      }}
      asChild
    >
      <Pressable
        className={`overflow-hidden rounded-lg ${complete ? "border border-white opacity-50" : isLastPlayed ? "bg-slate-600" : "bg-slate-600/50"}`}
      >
        <View className="flex flex-row justify-between gap-2 px-4 pt-3 pb-2">
          <Text className="w-4/5 font-bold text-white">
            {audioChapter.title}
          </Text>

          {complete && (
            <View>
              <FontAwesome6 name="circle-check" size={24} color="white" />
            </View>
          )}
          {!complete && (
            <View>
              <FontAwesome6 name="circle-play" size={24} color="white" />
            </View>
          )}
        </View>
        <View
          className="h-1 rounded-l-full rounded-r-full bg-yellow-300"
          style={{
            width: `${calculateDurationPercentage((libraryItem.audiobookLocation ?? 0) - audioChapter.start <= 0 ? 0 : (libraryItem.audiobookLocation ?? 0) - audioChapter.start, audioChapter.duration)}%`,
          }}
        />
      </Pressable>
    </Link>
  );
};

const Series = () => {
  return (
    <View>
      <Text className="mt-6 text-3xl font-bold text-white">Series</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
      >
        <View className="mt-2 flex-row items-center gap-4">
          <View className="h-37.5 w-25 rounded-lg bg-black/40 p-2">
            <Text className="font-bold text-white">Series Title</Text>
            <Text className="text-sm text-white/80">3 Books</Text>
          </View>
          <View className="h-37.5 w-25 rounded-lg bg-black/40 p-2">
            <Text className="font-bold text-white">Series Title</Text>
            <Text className="text-sm text-white/80">3 Books</Text>
          </View>
          <View className="h-37.5 w-25 rounded-lg bg-black/40 p-2">
            <Text className="font-bold text-white">Series Title</Text>
            <Text className="text-sm text-white/80">3 Books</Text>
          </View>
          <View className="h-37.5 w-25 rounded-lg bg-black/40 p-2">
            <Text className="font-bold text-white">Series Title</Text>
            <Text className="text-sm text-white/80">3 Books</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const hideHtmlTags = (str: string) => {
  return str.replace(/<[^>]*>?/gm, "");
};
