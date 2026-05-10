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
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";

import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { colors } from "@/components/ui/colors";
import CoverArt from "@/components/ui/cover-art";
import { generateGradientFromImageUrl } from "@/components/ui/graident-colors";
import { Marquee } from "@/components/ui/marquee-text";
import { db } from "@/db";
import { libraryItemWithFilesSchemaType } from "@/db/schema";
import { formatSecondsToTime } from "@/services/progressService";
import { useSessionStore } from "@/stores/session-store";
import { absolutePathUri } from "@/utils/file-utils";
import { TrackPlayerExtraPayload } from "../_layout";

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

  useEffect(() => {
    const fetchLibraryItem = async () => {
      const libraryItem = await db.query.libraryItemSchema.findFirst({
        where: {
          id: libraryItemId,
        },
        with: {
          audioChapters: true,
          ebook: true,
        },
      });
      if (!libraryItem) {
        console.error("Library item not found");
        return;
      }
      setLibraryItem(libraryItem);
    };

    if (libraryItemId) {
      fetchLibraryItem();
    }
  }, [libraryItemId]);

  useEffect(() => {
    async function setupPlaylist() {
      if (!libraryItem) {
        console.error("Library item not loaded yet");
        return;
      }

      const id = await PlayerQueue.createPlaylist(
        "Default Playlist",
        "Default queue",
      );

      // determine active chapter and position in chapter
      let activeChapterIndex = -1;
      if (audiobookLocation) {
        const audiobookLocationAsNumber = parseFloat(audiobookLocation);
        activeChapterIndex = libraryItem.audioChapters.findIndex(
          (chapter) =>
            chapter.start <= audiobookLocationAsNumber &&
            chapter.end > audiobookLocationAsNumber,
        );
      }

      // determine if we have 1 audio file per chapter or 1 audio file for ALL chapters
      const playlistType =
        new Set(
          libraryItem.audioChapters.map((chapter) => chapter.mediaRemoteId),
        ).size === libraryItem.audioChapters.length
          ? "file-per-chapter"
          : "file-for-all-chapters";

      // build playlist
      let playableAudioChapters: TrackItem[] = [];
      if (playlistType === "file-per-chapter") {
        playableAudioChapters = libraryItem.audioChapters.map(
          (audioChapter, index) => ({
            id: index.toString(),
            title: audioChapter.title,
            artist: libraryItem.authorName ?? "Unknown Author",
            album: libraryItem.title ?? "Unknown Title",
            duration: audioChapter.duration,
            url: absolutePathUri(
              `${libraryItem.remoteId}/${audioChapter.mediaRemoteId}${audioChapter.mediaFormat}`,
            ),
            artwork: libraryItem.coverArtPath ?? undefined,
            extraPayload: {
              playlistType,
              libraryItemId: libraryItem.id,
              start: audioChapter.start,
              totalDuration: libraryItem.audiobookDuration ?? 0,
            } as TrackPlayerExtraPayload,
          }),
        );

        await PlayerQueue.addTracksToPlaylist(id, playableAudioChapters);
        await PlayerQueue.loadPlaylist(id);

        if (activeChapterIndex !== -1) {
          await TrackPlayer.skipToIndex(activeChapterIndex);
          await TrackPlayer.seek(
            parseFloat(audiobookLocation) -
              libraryItem.audioChapters[activeChapterIndex].start,
          );
        }
        await TrackPlayer.play();
      } else {
        // 1 file for ALL chapters
        console.log(
          "playlist type: file-for-all-chapters, active chapter index:",
          activeChapterIndex,
        );
        const activeAudioChapter =
          activeChapterIndex !== -1
            ? libraryItem.audioChapters[activeChapterIndex]
            : null;
        const audioFile = {
          mediaRemoteId: libraryItem.audioChapters[0].mediaRemoteId,
          mediaFormat: libraryItem.audioChapters[0].mediaFormat,
          duration: libraryItem.audiobookDuration ?? 0,
        };
        // we load 1 chapter at a time and always the same audio file
        playableAudioChapters = [
          {
            id: activeAudioChapter?.index.toString() ?? "0",
            title: activeAudioChapter?.title ?? "Unknown Title",
            artist: libraryItem.authorName ?? "Unknown Author",
            album: libraryItem.title ?? "Unknown Title",
            duration: audioFile.duration,
            url: absolutePathUri(
              `${libraryItem.remoteId}/${audioFile.mediaRemoteId}${audioFile.mediaFormat}`,
            ),
            artwork: libraryItem.coverArtPath ?? undefined,
            extraPayload: {
              // file-for-all-chapters stuff
              playlistType,
              chapters: libraryItem.audioChapters.map((chapter) => ({
                index: chapter.index,
                title: chapter.title,
                start: chapter.start,
                end: chapter.end,
              })),
              // normal stuff
              libraryItemId: libraryItem.id,
              start: activeAudioChapter?.start ?? 0,
              totalDuration: libraryItem.audiobookDuration ?? 0,
            } as TrackPlayerExtraPayload,
          },
        ];

        await PlayerQueue.addTracksToPlaylist(id, playableAudioChapters);
        await PlayerQueue.loadPlaylist(id);
        await TrackPlayer.seek(activeAudioChapter?.start ?? 0);
        await TrackPlayer.play();
      }
    }

    if (mode === "play" && libraryItem) {
      setupPlaylist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryItem]);

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
          <MediaInfo />
          <TrackProgress />
          <MediaControls />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const MediaInfo = () => {
  const { track: currentTrack } = useOnChangeTrack();
  const { position: playbackPosition } = useOnPlaybackProgressChange();
  // TODO: couldn't figure out how to update the title so having to resolve it myself
  const [effectiveTitle, setEffectiveTitle] = useState("Loading...");
  useEffect(() => {
    if (!currentTrack?.extraPayload) {
      return;
    }
    const chapters = (currentTrack?.extraPayload as TrackPlayerExtraPayload)
      .chapters;
    if (!chapters) {
      setEffectiveTitle(currentTrack?.title ?? "Unknown Title");
      return;
    }
    const currentChapterIndex = chapters.findIndex(
      (chapter) =>
        chapter.start <= playbackPosition && chapter.end > playbackPosition,
    );
    if (currentChapterIndex === -1) {
      console.error("Current chapter not found");
      return;
    }
    setEffectiveTitle(chapters[currentChapterIndex].title);
  }, [currentTrack?.title, playbackPosition]);

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
  const { track: currentTrack } = useOnChangeTrack();

  return (
    <View className="mt-4 items-center gap-4">
      <View className="w-full flex-row items-center justify-evenly p-1">
        <TouchableOpacity
          onPress={() => {
            async function skipToPrevious() {
              if (
                "file-per-chapter" === currentTrack?.extraPayload?.playlistType
              ) {
                // TODO: is this necessary? seems like a bug that we have to skip twice to go to previous track, maybe related to how we are adding tracks to the queue, need to investigate further
                await TrackPlayer.skipToPrevious();
                await TrackPlayer.skipToPrevious();
                TrackPlayer.play();
              } else {
                // file-for-all-chapters logic
                const chapters = (
                  currentTrack?.extraPayload as TrackPlayerExtraPayload
                ).chapters;
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
                console.log({ title: previousChapter.title });
                await TrackPlayer.play();
              }
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
              if (
                "file-per-chapter" === currentTrack?.extraPayload?.playlistType
              ) {
                await TrackPlayer.skipToNext();
                TrackPlayer.play();
              } else {
                // file-for-all-chapters logic
                const chapters = (
                  currentTrack?.extraPayload as TrackPlayerExtraPayload
                ).chapters;
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
                console.log({ title: nextChapter.title });
                await TrackPlayer.play();
              }
            }

            skipToNext();
          }}
        >
          <Ionicons name="play-skip-forward" size={40} color="white" />
        </TouchableOpacity>
      </View>
      <View className="w-full flex-row items-center justify-between p-4">
        <TouchableOpacity
          onPress={() => {
            router.dismiss();
            router.push({
              pathname: `/media/[id]`,
              params: {
                id: (currentTrack?.extraPayload as TrackPlayerExtraPayload)
                  .libraryItemId,
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
