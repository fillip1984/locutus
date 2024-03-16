import type { Dispatch, SetStateAction } from "react";
import { Text, View } from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { cssInterop } from "nativewind";

import type { PlayerType, PlaylistItemType } from "@acme/validators";

cssInterop(FontAwesome6, {
  target: "style",
});

export default function AudioPlayer({
  player,
  setPlayer,
}: {
  player: PlayerType;
  setPlayer: Dispatch<SetStateAction<PlayerType>>;
}) {
  return (
    <View className="flex w-full rounded bg-slate-900">
      {player.source && player.internal && (
        <View>
          <TrackInfo media={player.source} />
          <TrackProgress player={player} />
          <Controls player={player} setPlayer={setPlayer} />
        </View>
      )}
    </View>
  );
}

const TrackInfo = ({ media }: { media: PlaylistItemType }) => {
  return (
    <View className="flex flex-row items-center gap-4 p-4">
      <View className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-300">
        <Text className="text-black">FSR</Text>
      </View>
      <View className="flex gap-2">
        <Text className="font-semibold text-sky-300">Ep. 128</Text>
        <Text className="font-bold text-slate-300">{media.title}</Text>
        <Text className="text-lg font-extrabold text-white">
          Full Stack Radio
        </Text>
      </View>
    </View>
  );
};

const TrackProgress = ({ player }: { player: PlayerType }) => {
  return (
    <View className="flex gap-4 p-4">
      <View className="relative">
        {/* TODO: progress slide is not smooth at all and the knob may overshoot the end */}
        <View
          className="absolute z-10 h-2 rounded-lg bg-sky-300 transition-all duration-75 ease-in-out"
          style={{ width: `${player.percentComplete ?? 0}%` }}></View>
        <View
          className="absolute -bottom-[12px] z-20 h-5 w-5 rounded-full bg-sky-300"
          style={{
            left: `${
              player.percentComplete
                ? player.percentComplete === 100
                  ? 100
                  : player.percentComplete - 1
                : 0
            }%`,
          }}></View>
        <View className="absolute h-2 w-full rounded-lg bg-slate-500"></View>
      </View>
      <View className="flex flex-row justify-between">
        <Text className="text-sky-300">
          {format(player.positionMillis ?? 0, "mm:ss")}
        </Text>
        <Text className="text-slate-300">
          {format(player.durationRemainingMillis ?? 0, "mm:ss")}
        </Text>
      </View>
    </View>
  );
};

const Controls = ({
  player,
  setPlayer,
}: {
  player: PlayerType;
  setPlayer: Dispatch<SetStateAction<PlayerType>>;
}) => {
  // TODO: figure out how to get expo vector to play with nativewind
  return (
    <View className="flex flex-row items-center justify-evenly rounded-b bg-slate-400 p-1">
      {/* <Ionicons name="bookmark-outline" size={30} color="black" /> */}
      <Ionicons name="play-skip-back-sharp" size={30} color="black" />
      <FontAwesome6
        onPress={() => {
          void player.internal?.setPositionAsync(
            player.positionMillis ? player.positionMillis - 30000 : 0,
          );
        }}
        name="arrow-rotate-left"
        size={30}
        color="black"
      />
      {player.playing ? (
        <Ionicons
          onPress={() =>
            setPlayer((prev) => {
              return { ...prev, playing: !prev.playing };
            })
          }
          name="pause"
          size={40}
          color="black"
        />
      ) : (
        <Ionicons
          onPress={() =>
            setPlayer((prev) => {
              return { ...prev, playing: !prev.playing };
            })
          }
          name="play-sharp"
          size={40}
          color="black"
        />
      )}
      <FontAwesome6
        onPress={() => {
          void player.internal?.setPositionAsync(
            player.positionMillis ? player.positionMillis + 30000 : 0,
          );
        }}
        name="arrow-rotate-right"
        size={30}
        color="black"
      />
      <Ionicons name="play-skip-forward" size={30} color="black" />
    </View>
  );
};
