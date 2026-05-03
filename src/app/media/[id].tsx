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

import { FontAwesome6 } from "@expo/vector-icons";

import { colors } from "@/components/ui/colors";
import { generateGradientFromImageUrl } from "@/components/ui/graident-colors";
import { db } from "@/db";
import {
  audiobookSchemaType,
  libraryItemWithFilesSchemaType,
} from "@/db/schema";
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
                height: 400,
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
              <MediaTracks
                libraryItem={libraryItem}
                scrollToTop={scrollToTop}
              />
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

  return (
    <View className="mt-2 flex-row items-center gap-4">
      {isResumable ? (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: `/player/[id]`,
              params: {
                id: libraryItem.id,
                audioFileId: libraryItem.lastPlayedId,
                mode: "resume",
              },
            })
          }
          className="flex w-full flex-row items-center justify-center rounded-full bg-white/20 px-4 py-4"
        >
          <Text className="font-semibold text-white">Resume</Text>
        </TouchableOpacity>
      ) : isDownloadable ? (
        <TouchableOpacity
          onPress={() => handleDownload(libraryItem.id)}
          className="flex w-full flex-row items-center justify-center rounded-full bg-white/20 px-4 py-4"
        >
          <Text className="font-semibold text-white">Download</Text>
        </TouchableOpacity>
      ) : isDownloading ? (
        <TouchableOpacity className="flex w-full flex-row items-center justify-center rounded-full bg-white/20 px-4 py-4">
          <Text className="font-semibold text-white">Downloading...</Text>
        </TouchableOpacity>
      ) : isPlayable ? (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: `/player/[id]`,
              params: {
                id: libraryItem.id,
                audioFileId: libraryItem.lastPlayedId,
                mode: "play",
              },
            })
          }
          className="flex w-full flex-row items-center justify-center rounded-full bg-white/10 px-4 py-4"
        >
          <Text className="font-semibold text-white/50">Play</Text>
        </TouchableOpacity>
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
  scrollToTop,
}: {
  libraryItem: libraryItemWithFilesSchemaType;
  scrollToTop: () => void;
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

      <View className="flex items-center justify-center pb-150">
        <Pressable onPress={scrollToTop} className="mt-8">
          <FontAwesome6 name="arrow-up-long" size={48} color="white" />
        </Pressable>
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
            width: `${calc(audioFile.progress ?? 1, audioFile.duration)}%`,
          }}
        />
      </Pressable>
    </Link>
  );
};

const hideHtmlTags = (str: string) => {
  return str.replace(/<[^>]*>?/gm, "");
};

const calc = (position: number, duration: number) => {
  const result = (position / duration) * 100;
  return parseInt(result.toFixed(2), 10);
};
