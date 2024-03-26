import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { localDb } from "@/db";
import {
  LibraryItemSchemaType,
  libraryItemAudioFileSchema,
  libraryItemSchema,
} from "@/db/schema";
import { PlayerState, usePlayerState } from "@/stores/playerStore";

export default function Player() {
  const { id } = useLocalSearchParams();
  const [libraryItem, setLibraryItem] =
    useState<LibraryItemSchemaType | null>();
  const playerState = usePlayerState();

  useEffect(() => {
    const fetchData = async () => {
      const result = await localDb
        .select()
        .from(libraryItemSchema)
        .where(eq(libraryItemSchema.id, parseInt(id as string, 10)));
      setLibraryItem(result[0]);

      const audioResults = await localDb
        .select()
        .from(libraryItemAudioFileSchema)
        .where(
          eq(
            libraryItemAudioFileSchema.libraryItemId,
            parseInt(id as string, 10),
          ),
        );

      playerState.setPlaylist(audioResults);
      playerState.setCurrentTrack(audioResults[0]);
      playerState.play();

      // await Audio.setAudioModeAsync({
      //   staysActiveInBackground: true,
      //   playsInSilentModeIOS: true,
      //   interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      //   interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      //   playThroughEarpieceAndroid: true,
      // });

      // const playback = await Audio.Sound.createAsync(
      //   { uri: audioResults[0].path as string },
      //   {
      //     shouldPlay: true,
      //   },
      // );
      // playerState.setPlaybackDriver(playback.sound);
    };

    fetchData();
  }, [id]);

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      {libraryItem && (
        <View className="flex h-screen gap-2 bg-slate-800 p-2">
          <TopActionsBar />
          <MediaArt />
          <MediaInfo libraryItem={libraryItem} playerState={playerState} />
          <MediaControls playerState={playerState} />
          {/*<MediaActionsBar media={media} />
        <MediaSummary />
        <MediaTracks /> */}
        </View>
      )}
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
  return (
    <View className="m-4 items-start justify-center">
      <View className="h-[300px] w-full rounded bg-slate-400">
        <Text className="text-white">FSR</Text>
      </View>
    </View>
  );
};

const MediaInfo = ({
  libraryItem,
  playerState,
}: {
  libraryItem: LibraryItemSchemaType;
  playerState: PlayerState;
}) => {
  return (
    <View className="">
      <Text className="text-2xl text-white">{libraryItem.title}</Text>
      <Text className="text-xl text-slate-400">
        {playerState.currentTrack?.name}
      </Text>
    </View>
  );
};

const MediaControls = ({ playerState }: { playerState: PlayerState }) => {
  return (
    <View className="flex flex-row items-center justify-evenly rounded-b bg-slate-400 p-1">
      {/* <Ionicons name="bookmark-outline" size={30} color="black" /> */}
      <Ionicons
        onPress={() => playerState.changeTrack(-1)}
        name="play-skip-back-sharp"
        size={30}
        color="black"
      />
      <FontAwesome6
        onPress={() => playerState.skipBack(30)}
        name="arrow-rotate-left"
        size={30}
        color="black"
      />
      {playerState.isPlaying ? (
        <Ionicons
          onPress={playerState.pause}
          name="pause"
          size={40}
          color="black"
        />
      ) : (
        <Ionicons
          onPress={playerState.play}
          name="play-sharp"
          size={40}
          color="black"
        />
      )}
      <FontAwesome6
        onPress={() => playerState.skipForward(30)}
        name="arrow-rotate-right"
        size={30}
        color="black"
      />
      <Ionicons
        onPress={() => playerState.changeTrack(1)}
        name="play-skip-forward"
        size={30}
        color="black"
      />
    </View>
  );
};
