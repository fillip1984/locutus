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
import { Image } from "expo-image";
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
import { generateGradientFromImageUrl } from "@/components/ui/graident-colors";
import { db } from "@/db";
import {
  audiobookSchemaType,
  audioFileSchema,
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
            audioFiles: true,
            eBookFiles: true,
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
            <Image
              source={libraryItem.coverArtPath}
              style={{
                marginHorizontal: "auto",
                height: 384,
                width: 240,
                borderRadius: 8,
              }}
              contentFit="contain"
              transition={300}
            />
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
              {libraryItem.audioFiles && libraryItem.audioFiles.length > 0 && (
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

  const hasAudioFiles = useCallback(
    () => libraryItem.audioFiles.length > 0,
    [libraryItem.audioFiles],
  );

  const hasDownloadableAudioFiles = useCallback(() => {
    return hasAudioFiles() && libraryItem.audioFiles.some((a) => !a.path);
  }, [libraryItem.audioFiles, hasAudioFiles]);

  const hasEBookFiles = useCallback(
    () => libraryItem.eBookFiles.length > 0,
    [libraryItem.eBookFiles],
  );

  const hasDownloadableEBookFiles = useCallback(() => {
    return hasEBookFiles() && libraryItem.eBookFiles.some((a) => !a.path);
  }, [libraryItem.eBookFiles, hasEBookFiles]);

  useEffect(() => {
    if (!libraryItem) return;
    setIsResumable(
      libraryItem.id === currentTrack?.extraPayload?.libraryItemId &&
        currentState === "playing",
    );
    setIsPlayable(
      !isResumable && hasAudioFiles() && !hasDownloadableAudioFiles(),
    );
    setIsReadable(hasEBookFiles() && !hasDownloadableEBookFiles());
    setIsDownloading(downloadStore.isDownloading(libraryItem.id ?? ""));
    setIsDownloadable(
      !downloadStore.isDownloading(libraryItem.id) &&
        (hasDownloadableAudioFiles() || hasDownloadableEBookFiles()),
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
        lastPlayedId: null,
        complete: newReadStatus === "complete" ? true : false,
      })
      .where(eq(libraryItemSchema.id, libraryItem.id));

    const audioFiles = await db.query.audioFileSchema.findMany({
      where: {
        libraryItemId: libraryItem.id,
      },
    });
    for (const audioFile of audioFiles) {
      await db
        .update(audioFileSchema)
        .set({
          complete: newReadStatus === "complete" ? true : false,
          progress: newReadStatus === "complete" ? audioFile.duration : 0,
        })
        .where(eq(audioFileSchema.id, audioFile.id));
    }
    setReadStatus(newReadStatus);
  };

  const [totalDuration, setTotalDuration] = useState(0);
  useEffect(() => {
    if (!libraryItem) return;
    const duration = libraryItem.audioFiles.reduce((acc, audioFile) => {
      return acc + audioFile.duration;
    }, 0);
    setTotalDuration(duration);
  }, [libraryItem]);

  const [remainingDuration, setRemainingDuration] = useState(0);
  useEffect(() => {
    if (!libraryItem) return;
    const remaining = libraryItem.audioFiles
      .filter((audioFile) => !audioFile.complete)
      .reduce((acc, audioFile) => {
        if (libraryItem.lastPlayedId === audioFile.id) {
          return acc + (audioFile.duration - (audioFile.progress ?? 0));
        } else {
          return acc + audioFile.duration;
        }
      }, 0);
    setRemainingDuration(remaining);
  }, [libraryItem]);

  const [percentageRemaining, setPercentageRemaining] = useState(0);
  useEffect(() => {
    if (!libraryItem) return;

    const percentage =
      totalDuration && remainingDuration
        ? (remainingDuration / totalDuration) * 100
        : 0;
    setPercentageRemaining(Math.round(percentage));
  }, [remainingDuration, totalDuration, libraryItem]);

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
                  audioFileId: libraryItem.lastPlayedId,
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
                    {remainingDuration > 0 &&
                      `${formatSecondsToTime(remainingDuration, "duration")} | ${percentageRemaining}% remaining`}
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
                eBookFileId: libraryItem.lastEBookId,
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
          {libraryItem.audioFiles?.filter((a) => !a.complete).length}/
          {libraryItem.audioFiles?.length} remaining
        </Text>
      </View>

      <View className="my-2 flex gap-2">
        {libraryItem.audioFiles?.map((audioFile, i) => (
          <Chapter
            key={audioFile.id}
            audioFile={audioFile}
            isLastPlayed={libraryItem.lastPlayedId === audioFile.id}
          />
        ))}
      </View>
    </View>
  );
};

const Chapter = ({
  audioFile,
  isLastPlayed,
}: {
  audioFile: audiobookSchemaType;
  isLastPlayed: boolean;
}) => {
  // console.log(
  //   "Rendering chapter",
  //   audioFile.name,
  //   "isLastPlayed:",
  //   isLastPlayed,
  // );
  return (
    <Link
      disabled={!audioFile.path}
      href={{
        pathname: "/player/[id]",
        params: {
          id: audioFile.libraryItemId,
          audioFileId: audioFile.id,
          mode: isLastPlayed ? "resume" : "play",
        },
      }}
      asChild
    >
      <Pressable
        className={`overflow-hidden rounded-lg ${audioFile.complete ? "border border-white opacity-50" : isLastPlayed ? "bg-sky-300" : "bg-slate-400/30"}`}
      >
        <View className="flex flex-row justify-between gap-2 px-4 pt-3 pb-2">
          <Text className="w-4/5 font-bold text-white">{audioFile.name}</Text>

          {audioFile.path && audioFile.complete && (
            <View>
              <FontAwesome6 name="circle-check" size={24} color="white" />
            </View>
          )}
          {/* TODO: replace play symbol with either a pause or a sound sampler logo */}
          {audioFile.path && !audioFile.complete && (
            <View>
              <FontAwesome6 name="circle-play" size={24} color="white" />
            </View>
          )}
        </View>
        <View
          className="h-1 rounded-l-full rounded-r-full bg-yellow-300"
          style={{
            width: `${calculateDurationPercentage(audioFile.progress ?? 1, audioFile.duration)}%`,
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
