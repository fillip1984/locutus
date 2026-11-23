import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import {
  PlayerQueue,
  TrackPlayer,
  useOnChangeTrack,
  useOnPlaybackProgressChange,
  useOnPlaybackStateChange,
} from "react-native-nitro-player";
import { SafeAreaView } from "react-native-safe-area-context";

import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { toast } from "sonner-native";

import { colors } from "@/components/ui/colors";
import CoverArt from "@/components/ui/cover-art";
import { generateGradientFromImageUrl } from "@/components/ui/graident-colors";
import { Marquee } from "@/components/ui/marquee-text";
import { db } from "@/db";
import { libraryItemWithFilesSchemaType } from "@/db/schema";
import {
  createPlaylistSetup,
  skipToPreviousChapter,
} from "@/services/player-playlist";
import { formatSecondsToTime } from "@/services/progressService";
import { useSessionStore } from "@/stores/session-store";
import { absolutePathUri } from "@/utils/file-utils";
import { TrackPlayerExtraPayload } from "../_layout";

const setupPlaylist = createPlaylistSetup(
  PlayerQueue,
  TrackPlayer,
  absolutePathUri,
);

export default function Player() {
  const {
    id: libraryItemId,
    audiobookLocation,
    mode,
  } = useLocalSearchParams<{
    id: string;
    audiobookLocation: string;
    mode: "play" | "resume";
  }>();
  const [libraryItem, setLibraryItem] =
    useState<libraryItemWithFilesSchemaType | null>(null);
  const [isReady, setIsReady] = useState(false);
  const completedSetup = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;
      const setupKey = JSON.stringify([libraryItemId, audiobookLocation, mode]);

      const initialize = async () => {
        const item = await db.query.libraryItemSchema.findFirst({
          where: { id: libraryItemId },
          with: { audioChapters: true, ebook: true },
        });
        if (isCancelled) return;
        if (!item) {
          throw new Error(`Library item not found: ${libraryItemId}`);
        }
        setLibraryItem(item);

        if (completedSetup.current === setupKey) return;
        setIsReady(false);
        const ready = await setupPlaylist(
          item,
          audiobookLocation,
          mode,
          () => isCancelled,
        );
        if (!isCancelled && ready) {
          completedSetup.current = setupKey;
          setIsReady(true);
        }
      };

      void initialize().catch((error) => {
        console.error("Unable to initialize player", error);
        if (!isCancelled) {
          toast.error("Unable to start playback");
        }
      });

      return () => {
        isCancelled = true;
      };
    }, [libraryItemId, audiobookLocation, mode]),
  );

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
          <View className="mx-auto my-2 h-1 w-10 rounded-full bg-white"></View>
          <CoverArt coverArtPath={libraryItem?.coverArtPath ?? null} />
          <MediaInfo libraryItemId={libraryItemId} isReady={isReady} />
          <TrackProgress libraryItemId={libraryItemId} isReady={isReady} />
          <MediaControls libraryItemId={libraryItemId} isReady={isReady} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

type PlayerComponentProps = { libraryItemId: string; isReady: boolean };

const MediaInfo = ({ libraryItemId, isReady }: PlayerComponentProps) => {
  const { track } = useOnChangeTrack();
  const currentTrack =
    isReady && track?.extraPayload?.libraryItemId === libraryItemId
      ? track
      : null;
  const { position: playbackPosition } = useOnPlaybackProgressChange();
  const effectiveTitle = useMemo(() => {
    if (!currentTrack?.extraPayload) {
      return currentTrack?.title ?? "Loading...";
    }
    const chapters = (currentTrack.extraPayload as TrackPlayerExtraPayload)
      .chapters;
    if (!chapters) {
      return currentTrack.title ?? "Unknown Title";
    }
    const currentChapter = chapters.find(
      (chapter) =>
        chapter.start <= playbackPosition && chapter.end > playbackPosition,
    );
    return currentChapter?.title ?? currentTrack.title ?? "Unknown Title";
  }, [currentTrack, playbackPosition]);

  return (
    <View className="flex">
      <Text className="text-2xl font-semibold text-white">
        {currentTrack?.album}
      </Text>
      <Text className="text-xl text-white/80">{currentTrack?.artist}</Text>
      <View className="mt-1 mb-3">
        <Marquee spacing={40} speed={0.6} delay={3000}>
          <Text className="text-white/80">{effectiveTitle}</Text>
        </Marquee>
      </View>
    </View>
  );
};

const TrackProgress = ({ libraryItemId, isReady }: PlayerComponentProps) => {
  const { position: playbackPosition, totalDuration } =
    useOnPlaybackProgressChange();
  const { track } = useOnChangeTrack();
  const enabled =
    isReady &&
    track?.extraPayload?.libraryItemId === libraryItemId &&
    totalDuration > 0;

  return (
    <View>
      <Slider
        minimumValue={0}
        maximumValue={100}
        disabled={!enabled}
        value={
          enabled ? Math.round((playbackPosition / totalDuration) * 100) : 0
        }
        onSlidingComplete={(newValue) => {
          TrackPlayer.seek(newValue * 0.01 * totalDuration);
        }}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#000000"
      />
      <View className="flex flex-row items-center justify-between">
        <Text className="text-slate-300">
          {formatSecondsToTime(enabled ? playbackPosition : 0, "timestamp")}
        </Text>
        <Text className="text-slate-300">
          {formatSecondsToTime(
            enabled ? totalDuration - playbackPosition : 0,
            "timestamp",
          )}
        </Text>
      </View>
    </View>
  );
};

const MediaControls = ({ libraryItemId, isReady }: PlayerComponentProps) => {
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
  const { track: currentTrack } = useOnChangeTrack();
  const enabled =
    isReady && currentTrack?.extraPayload?.libraryItemId === libraryItemId;
  const payload = enabled
    ? (currentTrack.extraPayload as TrackPlayerExtraPayload)
    : undefined;

  return (
    <View className="mt-4 items-center gap-4">
      <View className="w-full flex-row items-center justify-evenly p-1">
        <TouchableOpacity
          disabled={!payload}
          onPress={() => {
            async function skipToPrevious() {
              if (!payload) return;
              if (payload.playlistType === "file-per-chapter") {
                await skipToPreviousChapter(TrackPlayer);
                await TrackPlayer.play();
              } else {
                // file-for-all-chapters logic
                const chapters = payload.chapters;
                if (!chapters) {
                  console.error("No chapters found in extra payload");
                  return;
                }
                const currentChapterIndex = chapters.findIndex(
                  (chapter) =>
                    chapter.start <= playbackPosition &&
                    chapter.end > playbackPosition,
                );
                if (currentChapterIndex === -1) {
                  console.error("Current chapter not found");
                  return;
                }
                const previousChapter =
                  chapters[currentChapterIndex - 1] ?? chapters[0];
                await TrackPlayer.seek(previousChapter.start);
                await TrackPlayer.play();
              }
            }

            void skipToPrevious().catch((error) => {
              console.error("Unable to skip to previous chapter", error);
              toast.error("Unable to skip to previous chapter");
            });
          }}
        >
          <Ionicons name="play-skip-back" size={40} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!enabled}
          onPress={() => TrackPlayer.seek(playbackPosition - 10)}
          className="relative flex items-center justify-center"
        >
          <FontAwesome6 name="arrow-rotate-left" size={40} color="white" />
          <Text className="absolute pl-1 text-xs text-white">10</Text>
        </TouchableOpacity>
        {playbackState === "playing" ? (
          <TouchableOpacity
            disabled={!enabled}
            onPress={() => TrackPlayer.pause()}
          >
            <Ionicons name="pause" size={60} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            disabled={!enabled}
            onPress={() => TrackPlayer.play()}
          >
            <Ionicons name="play" size={60} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          disabled={!enabled}
          onPress={() => TrackPlayer.seek(playbackPosition + 30)}
          className="relative flex items-center justify-center"
        >
          <FontAwesome6 name="arrow-rotate-right" size={40} color="white" />
          <Text className="absolute pr-1 text-xs text-white">30</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!payload}
          onPress={() => {
            async function skipToNext() {
              if (!payload) return;
              if (payload.playlistType === "file-per-chapter") {
                await TrackPlayer.skipToNext();
                await TrackPlayer.play();
              } else {
                // file-for-all-chapters logic
                const chapters = payload.chapters;
                if (!chapters) {
                  console.error("No chapters found in extra payload");
                  return;
                }
                const currentChapterIndex = chapters.findIndex(
                  (chapter) =>
                    chapter.start <= playbackPosition &&
                    chapter.end > playbackPosition,
                );
                if (currentChapterIndex === -1) {
                  console.error("Current chapter not found");
                  return;
                }
                const nextChapter =
                  chapters[currentChapterIndex + 1] ??
                  chapters[chapters.length - 1];
                await TrackPlayer.seek(nextChapter.start);
                await TrackPlayer.play();
              }
            }

            void skipToNext().catch((error) => {
              console.error("Unable to skip to next chapter", error);
              toast.error("Unable to skip to next chapter");
            });
          }}
        >
          <Ionicons name="play-skip-forward" size={40} color="white" />
        </TouchableOpacity>
      </View>
      <View className="w-full flex-row items-center justify-between p-4">
        <TouchableOpacity
          disabled={!payload}
          onPress={() => {
            if (!payload) return;
            router.dismiss();
            router.push({
              pathname: `/media/[id]`,
              params: {
                id: payload.libraryItemId,
              },
            });
          }}
        >
          <Feather name="list" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSetRate} className="rounded-md p-2">
          <Text className="text-2xl font-bold text-white">
            {userSettings?.preferredPlaybackRate ?? 1}x
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
