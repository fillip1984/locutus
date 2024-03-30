import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
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
      console.log(`refetching player data`);
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
      playerState.play(audioResults[0]);
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
          <TrackProgress playerState={playerState} />
          <MediaControls playerState={playerState} />
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

const TrackProgress = ({ playerState }: { playerState: PlayerState }) => {
  return (
    <View className="flex gap-4 p-4">
      <View className="relative">
        {/* TODO: progress slide is not smooth at all and the knob may overshoot the end */}
        <View
          className="absolute z-10 h-2 rounded-lg bg-sky-300 transition-all duration-75 ease-in-out"
          style={{ width: `${playerState.percentComplete ?? 0}%` }}
        />
        <View
          className="absolute -bottom-[12px] z-20 h-5 w-5 rounded-full bg-sky-300"
          style={{
            left: `${playerState.percentComplete}%`,
          }}
        />
        <View className="absolute h-2 w-full rounded-lg bg-slate-500" />
      </View>
      <View className="flex flex-row justify-between">
        <Text className="text-sky-300">
          {format(playerState.positionMillis ?? 0, "mm:ss")}
        </Text>
        <Text className="text-slate-300">
          {format(playerState.durationRemainingMillis ?? 0, "mm:ss")}
        </Text>
      </View>
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
          onPress={() => playerState.play()}
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
