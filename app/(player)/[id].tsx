import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import TrackPlayer, {
  State,
  Track,
  useActiveTrack,
  usePlaybackState,
  useProgress,
} from "react-native-track-player";

import {
  jumpBackward,
  jumpForward,
  skipToNext,
  skipToPrevious,
} from "../../services/playbackService";

import { localDb } from "@/db";
import {
  LibraryItemAudioFileSchemaType,
  libraryItemAudioFileSchema,
  libraryItemSchema,
} from "@/db/schema";

export default function Player() {
  const { audioFileId: audioFileIdSearchParam, id: libraryItemIdSearchParam } =
    useLocalSearchParams();

  useEffect(() => {
    const audioFileId = parseInt(audioFileIdSearchParam as string, 10);
    const libraryItemId = parseInt(libraryItemIdSearchParam as string, 10);

    const fetchData = async () => {
      const libraryItem = await localDb.query.libraryItemSchema.findFirst({
        where: eq(libraryItemSchema.id, libraryItemId),
      });

      if (!libraryItem) {
        const msg = `Unable to find library item for id: ${libraryItemId}`;
        Toast.show({
          type: "error",
          text1: msg,
        });
        throw Error(msg);
      }

      const audioFiles =
        await localDb.query.libraryItemAudioFileSchema.findMany({
          where: eq(libraryItemAudioFileSchema.libraryItemId, libraryItemId),
        });

      let audioFile: LibraryItemAudioFileSchemaType | undefined;
      if (audioFileId) {
        // user selected a specific track
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

      if (!audioFile) {
        const msg = `Unable to find audio file to play for audio file id: ${audioFileId}`;
        Toast.show({
          type: "error",
          text1: msg,
        });
        throw Error(msg);
      }

      const activeTrack = await TrackPlayer.getActiveTrack();

      if (audioFile.id === activeTrack?.id) {
        // console.log("if audioFile matches activeTrack then do nothing");
      } else if (
        (await TrackPlayer.getQueue()).find((q) => q.id === audioFile?.id)
      ) {
        // console.log("if audioFile is within queue, skip to audioFile");
        const trackToLoadIndex = (await TrackPlayer.getQueue()).findIndex(
          (q) => q.id === audioFile?.id,
        );
        // console.log(
        //   `determining starting point based on progress: ${audioFile.progress}`,
        // );
        await TrackPlayer.skip(trackToLoadIndex, audioFile.progress ?? 0);
        await TrackPlayer.play();
      } else {
        // console.log("reset and reload the works");
        await TrackPlayer.reset();
        await TrackPlayer.add(
          audioFiles.map(
            (af) =>
              ({
                id: af.id,
                title: af.name,
                artist: libraryItem.authorName,
                album: libraryItem.title,
                artwork: libraryItem.coverArtPath ?? undefined,
                url: af.path as string,
                duration: af.duration,
              }) as Track,
          ),
        );

        const trackToLoadIndex = (await TrackPlayer.getQueue()).findIndex(
          (q) => q.id === audioFile?.id,
        );
        await TrackPlayer.skip(trackToLoadIndex, audioFile.progress ?? 0);
        await TrackPlayer.play();
      }
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen gap-2 bg-slate-800 p-2">
        <Stack.Screen options={{ gestureDirection: "vertical" }} />
        <TopActionsBar />
        <View className="h-1/2">
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
  const track = useActiveTrack();
  return (
    <View className="flex h-2/3 w-full">
      <Image
        source={track?.artwork}
        style={{ flex: 1 }}
        contentFit="cover"
        transition={1000}
      />
    </View>
  );
};

const MediaInfo = () => {
  const track = useActiveTrack();

  return (
    <View>
      <Text className="text-2xl text-white">{track?.album}</Text>
      <Text className="text-xl text-slate-400">{track?.title}</Text>
    </View>
  );
};

const TrackProgress = () => {
  const progress = useProgress();

  return (
    <View className="flex">
      <Slider
        // style={{ width: 100, height: 90 }}
        minimumValue={0}
        maximumValue={100}
        value={Math.round((progress.position / progress.duration) * 100)}
        onSlidingComplete={(newValue) => {
          TrackPlayer.seekTo(newValue * 0.01 * progress.duration);
        }}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#000000"
      />
      <View className="flex flex-row justify-between">
        <Text className="text-sky-300">
          {format(progress.position * 1000, "mm:ss")}
        </Text>
        <Text className="text-slate-300">
          {format((progress.duration - progress.position) * 1000, "mm:ss")}
        </Text>
      </View>
    </View>
  );
};

const MediaControls = () => {
  const { state: playbackState } = usePlaybackState();
  const [rate, setRate] = useState(1);
  const handleSetRate = () => {
    // increments in .25, cycles back to .5x if over 2x
    const newRate = rate + 0.25 > 2 ? 0.5 : rate + 0.25;
    TrackPlayer.setRate(newRate);
    setRate(newRate);
  };
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
          onPress={jumpBackward}
          name="arrow-rotate-left"
          size={30}
          color="white"
        />
        {playbackState === State.Playing ? (
          <Ionicons
            onPress={TrackPlayer.pause}
            name="pause"
            size={40}
            color="white"
          />
        ) : (
          <Ionicons
            onPress={TrackPlayer.play}
            name="play-sharp"
            size={40}
            color="white"
          />
        )}
        <FontAwesome6
          onPress={jumpForward}
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
          <Text className="text-2xl text-white">{rate}x</Text>
        </Pressable>
      </View>
    </View>
  );
};
