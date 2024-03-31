import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { format } from "date-fns";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";

import { LibraryItemSchemaType } from "@/db/schema";
import { useMediaState } from "@/stores/mediaStore";
import { PlayerState, usePlayerState } from "@/stores/playerStore";

export default function Player() {
  const playerState = usePlayerState();
  const mediaState = useMediaState();
  useEffect(() => {
    // TODO: seems like we would have a race condition of both player and media states pulling in info but this current design expects that the media state is already fetched
    if (mediaState.audioFiles) {
      playerState.setPlaylist(mediaState.audioFiles);
      playerState.play({ audioFile: mediaState.audioFiles[0] });
    }
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      {mediaState.libraryItem && (
        <View className="flex h-screen gap-2 bg-slate-800 p-2">
          <TopActionsBar />
          <View className="h-1/2">
            <MediaArt libraryItem={mediaState.libraryItem} />
            <MediaInfo
              libraryItem={mediaState.libraryItem}
              playerState={playerState}
            />
          </View>
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

const MediaArt = ({ libraryItem }: { libraryItem: LibraryItemSchemaType }) => {
  return (
    <View className="flex h-2/3 w-full">
      <Image
        key={libraryItem.id}
        source={libraryItem.coverArtPath}
        style={{ flex: 1 }}
        contentFit="cover"
        transition={1000}
      />
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
    <View>
      <Text className="text-2xl text-white">{libraryItem.title}</Text>
      <Text className="text-xl text-slate-400">
        {playerState.currentTrack?.name}
      </Text>
    </View>
  );
};

const TrackProgress = ({ playerState }: { playerState: PlayerState }) => {
  return (
    <View className="flex">
      {/* <View className="relative">
        // TODO: progress slide is not smooth at all and the knob may overshoot the end
        <View
          id="progressBar"
          className="absolute z-10 h-2 rounded-lg bg-sky-300"
          style={{ width: `${playerState.percentComplete}%` }}
        />
        <View
          id="knob"
          className="absolute -bottom-[9px] z-20 h-3 w-3 rounded-full bg-sky-300"
          style={{
            left: `${playerState.percentComplete - 1}%`,
          }}
        />
        <View className="absolute h-2 w-full rounded-lg bg-slate-500" />
      </View> */}
      <Slider
        // style={{ width: 100, height: 90 }}
        minimumValue={0}
        maximumValue={100}
        value={playerState.percentComplete}
        onSlidingComplete={(newValue) => {
          console.log({
            newValue,
            startingPosition: newValue * 0.01 * playerState.durationMillis,
            duration: playerState.durationMillis,
            currentPos: playerState.positionMillis,
          });
          playerState.play({
            startingPosition: newValue * 0.01 * playerState.durationMillis,
          });
        }}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#000000"
      />
      <View className="flex flex-row justify-between">
        <Text className="text-sky-300">
          {format(playerState.positionMillis, "mm:ss")}
        </Text>
        <Text className="text-slate-300">
          {format(playerState.durationRemainingMillis, "mm:ss")}
        </Text>
      </View>
    </View>
  );
};

const MediaControls = ({ playerState }: { playerState: PlayerState }) => {
  return (
    <View className="flex items-center gap-4">
      <View className="flex w-full flex-row items-center justify-evenly p-1">
        {/* <Ionicons name="bookmark-outline" size={30} color="black" /> */}
        <Ionicons
          onPress={() => playerState.changeTrack(-1)}
          name="play-skip-back-sharp"
          size={30}
          color="white"
        />
        <FontAwesome6
          onPress={() => playerState.skipBack(30000)}
          name="arrow-rotate-left"
          size={30}
          color="white"
        />
        {playerState.isPlaying ? (
          <Ionicons
            onPress={playerState.pause}
            name="pause"
            size={40}
            color="white"
          />
        ) : (
          <Ionicons
            onPress={() => playerState.play({})}
            name="play-sharp"
            size={40}
            color="white"
          />
        )}
        <FontAwesome6
          onPress={() => playerState.skipForward(30000)}
          name="arrow-rotate-right"
          size={30}
          color="white"
        />
        <Ionicons
          onPress={() => playerState.changeTrack(1)}
          name="play-skip-forward"
          size={30}
          color="white"
        />
      </View>
      <View className="flex w-full items-end">
        <Pressable onPress={playerState.setRate} className="rounded-md p-2">
          <Text className="text-2xl text-white">{playerState.rate}x</Text>
        </Pressable>
      </View>
    </View>
  );
};
