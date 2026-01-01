import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { toast } from "sonner-native";
import { File, Paths } from "expo-file-system";

import { localDb } from "@/db";
import {
  LibraryItemAudioFileSchemaType,
  libraryItemAudioFileSchema,
  libraryItemSchema,
} from "@/db/schema";
import { Track, useTrackPlayer } from "@/stores/trackPlayerStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayerStatus } from "expo-audio";

export default function Player() {
  const { getActiveTrack, getQueue, play, skip, reset, add } = useTrackPlayer();

  const { audioFileId: audioFileIdSearchParam, id: libraryItemIdSearchParam } =
    useLocalSearchParams();

  useEffect(() => {
    const audioFileId = audioFileIdSearchParam as string;
    const libraryItemId = libraryItemIdSearchParam as string;

    const fetchData = async () => {
      const libraryItem = await localDb.query.libraryItemSchema.findFirst({
        where: eq(libraryItemSchema.id, libraryItemId),
      });

      if (!libraryItem) {
        const msg = `Unable to find library item for id: ${libraryItemId}`;
        toast.error(msg);
        throw Error(msg);
      }

      const audioFiles =
        await localDb.query.libraryItemAudioFileSchema.findMany({
          where: eq(libraryItemAudioFileSchema.libraryItemId, libraryItemId),
        });

      let audioFile: LibraryItemAudioFileSchemaType | undefined;
      if (audioFileId) {
        console.log("user selected a specific track");
        audioFile = await localDb.query.libraryItemAudioFileSchema.findFirst({
          where: eq(libraryItemAudioFileSchema.id, audioFileId),
        });
      } else {
        // otherwise try to play the last track played for the library item
        audioFile = audioFiles.find((a) => a.id === libraryItem?.lastPlayedId);
      }

      if (!audioFile) {
        // default to playing the first track
        audioFile = audioFiles[0];
      }

      console.log(`attempting to play audio file id: ${audioFileId}`);

      if (!audioFile) {
        const msg = `Unable to find audio file to play for audio file id: ${audioFileId}`;
        toast.error(msg);
        throw Error(msg);
      }

      const activeTrack = getActiveTrack();

      if (audioFile.id === activeTrack?.id) {
        console.log("if audioFile matches activeTrack then do nothing");
        play();
      } else if (getQueue().find((q) => q.id === audioFile?.id)) {
        console.log("if audioFile is within queue, skip to audioFile");
        const trackToLoadIndex = getQueue().findIndex(
          (q) => q.id === audioFile?.id,
        );
        console.log(
          `determining starting point based on progress: ${audioFile.progress}`,
        );
        skip(trackToLoadIndex, audioFile.progress ?? 0);
        play();
      } else {
        console.log("reset and reload the works");
        reset();
        add(
          audioFiles.map(
            (af) =>
              ({
                id: af.id,
                title: af.name,
                artist: libraryItem.authorNameLF,
                album: libraryItem.title,
                artwork: libraryItem.coverArtPath ?? undefined,
                // TODO: having issues with the saved off url to files so having to rebuild it here
                uri: new File(Paths.document, `${libraryItemId}`, `${af.name}`)
                  .uri,
                duration: af.duration,
              }) as Track,
          ),
        );

        const trackToLoadIndex = getQueue().findIndex(
          (q) => q.id === audioFile?.id,
        );
        skip(trackToLoadIndex, audioFile.progress ?? 0);
        play();
      }
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-full gap-2 bg-slate-800 p-2">
        <Stack.Screen options={{ gestureDirection: "vertical" }} />
        <TopActionsBar />
        <View className="flex-1">
          <MediaArt />
          <MediaInfo />
        </View>
        <TrackProgress />
        <MediaControls />
      </View>
    </SafeAreaView>
  );
}

const TopActionsBar = () => {
  return (
    <View>
      <Link href="..">
        {/* TODO: swipe down to dismiss, should animate down like a modal, back to where we came from, swipe left and right to go back and forward through tracks */}
        <Ionicons name="chevron-down" size={24} color="white" />
      </Link>
    </View>
  );
};

const MediaArt = () => {
  const { getActiveTrack } = useTrackPlayer();
  const track = getActiveTrack();

  return (
    <View className="flex w-full items-center">
      <View className="flex items-center overflow-hidden rounded-lg">
        <Image
          source={track?.artwork}
          style={{ width: 350, height: 350 }}
          contentFit="fill"
          transition={1000}
        />
      </View>
    </View>
  );
};

const MediaInfo = () => {
  const { getActiveTrack } = useTrackPlayer();
  const track = getActiveTrack();

  return (
    <View className="my-8">
      <Text className="text-2xl text-white">{track?.album}</Text>
      <Text className="text-xl text-slate-400">{track?.title}</Text>
    </View>
  );
};

const TrackProgress = () => {
  // const { progress, seekTo, duration } = useTrackPlayer();
  const { _player, seekTo } = useTrackPlayer();
  const { currentTime, duration } = useAudioPlayerStatus(_player);

  return (
    <View className="flex">
      <Slider
        // style={{ width: 100, height: 90 }}
        minimumValue={0}
        maximumValue={100}
        value={Math.round((currentTime / duration) * 100)}
        onSlidingComplete={(newValue) => {
          seekTo(newValue * 0.01 * duration);
        }}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#000000"
      />
      <View className="flex flex-row justify-between">
        <Text className="text-sky-300">
          {format(currentTime * 1000, "mm:ss")}
        </Text>
        <Text className="text-slate-300">
          {format((duration - currentTime) * 1000, "mm:ss")}
        </Text>
      </View>
    </View>
  );
};

const MediaControls = () => {
  const {
    play,
    pause,
    setRate,
    skipToNext,
    skipToPrevious,
    jumpBackward,
    jumpForward,
    _player,
  } = useTrackPlayer();
  const { playing, playbackRate } = useAudioPlayerStatus(_player);

  const [uiRate, setUIRate] = useState<number | undefined>();
  const handleSetRate = async () => {
    // increments in .25, cycles back to .5x if over 2x
    const currentRate = playbackRate || 1;
    const newRate = currentRate + 0.25 > 2 ? 0.5 : currentRate + 0.25;
    setRate(newRate);
    setUIRate(newRate);
  };

  useEffect(() => {
    const init = async () => {
      setUIRate(playbackRate || 1);
    };
    init();
  }, [playbackRate]);
  return (
    <View className="flex items-center gap-4">
      <View className="flex w-full flex-row items-center justify-evenly p-1">
        {/* <Ionicons name="bookmark-outline" size={30} color="black" /> */}
        <Ionicons
          onPress={skipToPrevious}
          name="play-skip-back-sharp"
          size={30}
          color="white"
        />
        <FontAwesome6
          onPress={() => jumpBackward(10)}
          name="arrow-rotate-left"
          size={30}
          color="white"
        />
        {playing ? (
          <Ionicons
            onPress={() => pause()}
            name="pause"
            size={40}
            color="white"
          />
        ) : (
          <Ionicons
            onPress={() => play()}
            name="play-sharp"
            size={40}
            color="white"
          />
        )}
        <FontAwesome6
          onPress={() => jumpForward(10)}
          name="arrow-rotate-right"
          size={30}
          color="white"
        />
        <Ionicons
          onPress={skipToNext}
          name="play-skip-forward"
          size={30}
          color="white"
        />
      </View>
      <View className="flex w-full items-end">
        <Pressable onPress={handleSetRate} className="rounded-md p-2">
          <Text className="text-2xl text-white">{uiRate}x</Text>
        </Pressable>
      </View>
    </View>
  );
};
