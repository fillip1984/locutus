import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  PlayerQueue,
  TrackItem,
  TrackPlayer,
  useOnChangeTrack,
  useOnPlaybackProgressChange,
  useOnPlaybackStateChange,
} from "react-native-nitro-player";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, Stack, useLocalSearchParams } from "expo-router";

import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { colors } from "@/components/ui/colors";
import { generateGradientFromImageUrl } from "@/components/ui/graident-colors";
import { db } from "@/db";
import {
  audiobookSchemaType,
  libraryItemWithFilesSchemaType,
} from "@/db/schema";
import { useSessionStore } from "@/stores/session-store";
import { absolutePathUri } from "@/utils/file-utils";
import { TrackPlayerExtraPayload } from "../_layout";

export default function Player() {
  const {
    id: libraryItemId,
    audioFileId,
    mode,
  } = useLocalSearchParams<{
    id: string;
    audioFileId: string;
    mode: "play" | "resume";
  }>();
  const [libraryItem, setLibraryItem] =
    useState<libraryItemWithFilesSchemaType | null>(null);
  useEffect(() => {
    const fetchLibraryItem = async () => {
      const libraryItem = await db.query.libraryItemSchema.findFirst({
        where: {
          id: libraryItemId,
        },
        with: {
          audioFiles: true,
          eBookFiles: true,
        },
      });
      if (!libraryItem) {
        console.error("Library item not found");
        return;
      }
      setLibraryItem(libraryItem);
      setAudioFiles(libraryItem.audioFiles);
    };

    if (libraryItemId) {
      fetchLibraryItem();
    }
  }, [libraryItemId]);

  const [audioFiles, setAudioFiles] = useState<audiobookSchemaType[]>([]);

  useEffect(() => {
    async function setupPlaylist() {
      console.log("Setting up playlist with audio files", audioFiles.length);
      const id = await PlayerQueue.createPlaylist(
        "Default Playlist",
        "Default queue",
      );
      const playableAudioFiles: TrackItem[] = audioFiles.map(
        (audioFile, index) => ({
          id: index.toString(),
          title: audioFile.name,
          artist: libraryItem?.authorName ?? "Unknown Author",
          album: libraryItem?.title ?? "Unknown Title",
          duration: audioFile.duration ?? 0,
          url: absolutePathUri(audioFile.path),
          artwork: libraryItem?.coverArtPath ?? undefined,
          extraPayload: {
            libraryItemId: libraryItem?.id ?? "",
            audioFileId: audioFile.id,
            previousTrack:
              index > 0
                ? {
                    audioFileId: audioFiles[index - 1]?.id ?? "",
                    duration: audioFiles[index - 1]?.duration ?? 0,
                  }
                : null,
          } as TrackPlayerExtraPayload,
        }),
      );
      await PlayerQueue.addTracksToPlaylist(id, playableAudioFiles);
      await PlayerQueue.loadPlaylist(id);

      // if resuming, skip to the correct track and position
      // or if user selected specific track to play, skip to that track and position
      const audioFile = audioFiles.find((file) => file.id === audioFileId);
      if (audioFile) {
        await TrackPlayer.skipToIndex(
          audioFiles.findIndex((file) => file.id === audioFileId),
        );
        await TrackPlayer.seek(
          audioFile.complete ? 0 : (audioFile.progress ?? 0),
        );
      }
      await TrackPlayer.play();
    }

    if (mode === "play" && audioFiles.length > 0) {
      setupPlaylist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFiles]);

  // gradient colors for the background, default to background color
  const [gradientColors, setGradientColors] = useState<[string, string]>([
    colors.background,
    colors.background,
  ]);

  useEffect(() => {
    let isCancelled = false;

    async function loadGradient() {
      if (!libraryItem?.coverArtPath) {
        setGradientColors([colors.background, colors.background]);
        return;
      }

      const gradient = await generateGradientFromImageUrl(
        libraryItem.coverArtPath,
      );
      if (!isCancelled) {
        setGradientColors(gradient.colors);
      }
    }
    loadGradient();
    return () => {
      isCancelled = true;
    };
  }, [libraryItem?.coverArtPath]);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex h-full gap-2 p-2">
          <Stack.Screen options={{ gestureDirection: "vertical" }} />
          <TopActionsBar />

          <View className="flex-1">
            <MediaArt coverArtUrl={libraryItem?.coverArtPath ?? null} />
            <MediaInfo />
          </View>
          <TrackProgress />
          <MediaControls />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const TopActionsBar = () => {
  return (
    <View className="mt-12 ml-2">
      <Link href="..">
        {/* TODO: swipe down to dismiss, should animate down like a modal, back to where we came from, swipe left and right to go back and forward through tracks */}
        <Ionicons name="chevron-down" size={24} color="white" />
      </Link>
    </View>
  );
};

const MediaArt = ({ coverArtUrl }: { coverArtUrl: string | null }) => {
  return (
    <View className="flex w-full items-center">
      <View className="flex items-center overflow-hidden rounded-lg">
        <Image
          source={coverArtUrl ? { uri: coverArtUrl } : undefined}
          style={{ width: 350, height: 350 }}
          contentFit="fill"
          transition={1000}
        />
      </View>
    </View>
  );
};

const MediaInfo = () => {
  const { track: currentTrack } = useOnChangeTrack();

  return (
    <View className="my-8">
      <Text className="text-2xl text-white">{currentTrack?.album}</Text>
      <Text className="text-xl text-white">
        {currentTrack?.title ?? "Unknown"}
      </Text>
    </View>
  );
};

const TrackProgress = () => {
  const { position: playbackPosition, totalDuration } =
    useOnPlaybackProgressChange();
  // TODO: add hours, also do not exceed 00:00:00 nor total duration
  const calculateCurrentPosition = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const calculateTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View className="mx-4 flex">
      <Slider
        minimumValue={0}
        maximumValue={100}
        value={Math.round((playbackPosition / totalDuration) * 100)}
        onSlidingComplete={(newValue) => {
          TrackPlayer.seek(newValue * 0.01 * totalDuration);
        }}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#000000"
      />
      <View className="flex flex-row justify-between">
        <Text className="text-sky-300">
          {calculateCurrentPosition(playbackPosition)}
        </Text>
        <Text className="text-slate-300">
          {calculateTimeRemaining(totalDuration - playbackPosition)}
        </Text>
      </View>
    </View>
  );
};

const MediaControls = () => {
  const { userSettings, setPreferredPlaybackRate } = useSessionStore();
  const handleSetRate = async () => {
    // increments in .25, cycles back to .5x if over 3x
    const currentRate = await TrackPlayer.getPlaybackSpeed();
    const newRate = currentRate + 0.25 > 3 ? 0.5 : currentRate + 0.25;
    TrackPlayer.setPlaybackSpeed(newRate);
    setPreferredPlaybackRate(newRate);
  };

  const { position: playbackPosition } = useOnPlaybackProgressChange();
  const { state: playbackState } = useOnPlaybackStateChange();

  return (
    <View className="flex items-center gap-4">
      <View className="flex w-full flex-row items-center justify-evenly p-1">
        {/* <Ionicons name="bookmark-outline" size={30} color="black" /> */}
        <Ionicons
          onPress={() => {
            async function skipToPrevious() {
              // TODO: is this necessary? seems like a bug that we have to skip twice to go to previous track, maybe related to how we are adding tracks to the queue, need to investigate further
              await TrackPlayer.skipToPrevious();
              await TrackPlayer.skipToPrevious();
              TrackPlayer.play();
            }
            skipToPrevious();
          }}
          name="play-skip-back-sharp"
          size={30}
          color="white"
        />
        <FontAwesome6
          onPress={() => TrackPlayer.seek(playbackPosition - 10)}
          name="arrow-rotate-left"
          size={30}
          color="white"
        />
        {playbackState === "playing" ? (
          <Ionicons
            onPress={() => TrackPlayer.pause()}
            name="pause"
            size={40}
            color="white"
          />
        ) : (
          <Ionicons
            onPress={() => TrackPlayer.play()}
            name="play-sharp"
            size={40}
            color="white"
          />
        )}
        <FontAwesome6
          onPress={() => TrackPlayer.seek(playbackPosition + 30)}
          name="arrow-rotate-right"
          size={30}
          color="white"
        />
        <Ionicons
          onPress={() => {
            async function skipToNext() {
              await TrackPlayer.skipToNext();
              TrackPlayer.play();
            }
            skipToNext();
          }}
          name="play-skip-forward"
          size={30}
          color="white"
        />
      </View>
      <View className="mb-4 flex w-full items-end">
        <Pressable onPress={handleSetRate} className="rounded-md p-2">
          <Text className="text-2xl text-white">
            {userSettings?.preferredPlaybackRate ?? 1}x
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
