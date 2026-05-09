import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
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
import { useLocalSearchParams } from "expo-router";

import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { colors } from "@/components/ui/colors";
import { generateGradientFromImageUrl } from "@/components/ui/graident-colors";
import { Marquee } from "@/components/ui/marquee-text";
import { db } from "@/db";
import {
  audiobookSchemaType,
  libraryItemWithFilesSchemaType,
} from "@/db/schema";
import { formatSecondsToTime } from "@/services/progressService";
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
      // console.log("Setting up playlist with audio files", audioFiles.length);
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
        <View className="flex gap-2 p-2">
          <View className="mx-auto mb-2 h-1 w-10 rounded-full bg-white"></View>
          <MediaArt coverArtUrl={libraryItem?.coverArtPath ?? null} />
          <MediaInfo />
          <TrackProgress />
          <MediaControls />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const MediaArt = ({ coverArtUrl }: { coverArtUrl: string | null }) => {
  return (
    <Image
      source={coverArtUrl ? { uri: coverArtUrl } : undefined}
      style={{
        marginHorizontal: "auto",
        height: 384,
        width: 240,
        borderRadius: 8,
      }}
      contentFit="contain"
      transition={300}
    />
  );
};

const MediaInfo = () => {
  const { track: currentTrack } = useOnChangeTrack();

  return (
    <View className="flex">
      <Text className="text-2xl font-semibold text-white">
        {currentTrack?.album}
      </Text>
      <Text className="text-xl text-white/80">{currentTrack?.artist}</Text>
      <View className="mt-1 mb-3">
        <Marquee spacing={40} speed={0.6} delay={3000}>
          <Text className="text-white/80">
            {currentTrack?.title ?? "Unknown"}
          </Text>
        </Marquee>
      </View>
    </View>
  );
};

const TrackProgress = () => {
  const { position: playbackPosition, totalDuration } =
    useOnPlaybackProgressChange();

  return (
    <View>
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
      <View className="flex flex-row items-center justify-between">
        <Text className="text-slate-300">
          {formatSecondsToTime(playbackPosition, "timestamp")}
        </Text>
        <Text className="text-slate-300">
          {formatSecondsToTime(totalDuration - playbackPosition, "timestamp")}
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
    setPreferredPlaybackRate(newRate);
  };
  useEffect(() => {
    TrackPlayer.setPlaybackSpeed(userSettings?.preferredPlaybackRate ?? 1);
  }, [userSettings?.preferredPlaybackRate]);

  const { position: playbackPosition } = useOnPlaybackProgressChange();
  const { state: playbackState } = useOnPlaybackStateChange();

  return (
    <View className="mt-4 items-center gap-4">
      <View className="w-full flex-row items-center justify-evenly p-1">
        <TouchableOpacity
          onPress={() => {
            async function skipToPrevious() {
              // TODO: is this necessary? seems like a bug that we have to skip twice to go to previous track, maybe related to how we are adding tracks to the queue, need to investigate further
              await TrackPlayer.skipToPrevious();
              await TrackPlayer.skipToPrevious();
              TrackPlayer.play();
            }
            skipToPrevious();
          }}
        >
          <Ionicons name="play-skip-back" size={40} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => TrackPlayer.seek(playbackPosition - 10)}
          className="relative flex items-center justify-center"
        >
          <FontAwesome6 name="arrow-rotate-left" size={40} color="white" />
          <Text className="absolute pl-1 text-xs text-white">10</Text>
        </TouchableOpacity>
        {playbackState === "playing" ? (
          <TouchableOpacity onPress={() => TrackPlayer.pause()}>
            <Ionicons name="pause" size={60} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => TrackPlayer.play()}>
            <Ionicons name="play" size={60} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => TrackPlayer.seek(playbackPosition + 30)}
          className="relative flex items-center justify-center"
        >
          <FontAwesome6 name="arrow-rotate-right" size={40} color="white" />
          <Text className="absolute pr-1 text-xs text-white">30</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            async function skipToNext() {
              await TrackPlayer.skipToNext();
              TrackPlayer.play();
            }
            skipToNext();
          }}
        >
          <Ionicons name="play-skip-forward" size={40} color="white" />
        </TouchableOpacity>
      </View>
      <View className="flex w-full items-end justify-end p-4">
        <TouchableOpacity onPress={handleSetRate} className="rounded-md p-2">
          <Text className="text-2xl font-bold text-white">
            {userSettings?.preferredPlaybackRate ?? 1}x
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
