import type { Dispatch, SetStateAction } from "react";
import { Text, View } from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";

import type { PlayerType, PlaylistItemType } from "@acme/validators";

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
          <TrackProgress player={player} setPlayer={setPlayer} />
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

const TrackProgress = ({
  player,
  setPlayer,
}: {
  player: PlayerType;
  setPlayer: Dispatch<SetStateAction<PlayerType>>;
}) => {
  return (
    <View className="flex gap-4 p-4">
      <View className="relative">
        <View
          className="absolute z-10 h-2 rounded-lg bg-sky-300"
          style={{ width: `${player.percentComplete ?? 0}%` }}></View>
        <View className="absolute h-2 w-full rounded-lg bg-slate-500 transition-all duration-75 ease-in-out"></View>
      </View>
      <View className="flex flex-row justify-between">
        <Text className="text-sky-300">{player.position}</Text>
        <Text className="text-slate-300">{player.durationRemaining}</Text>
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
    <View className="flex flex-row justify-evenly rounded-b bg-slate-400 p-4">
      <Ionicons name="bookmark-outline" size={24} color="black" />
      <Ionicons name="play-skip-back-sharp" size={24} color="black" />
      <FontAwesome6 name="arrow-rotate-left" size={24} color="black" />
      {player.playing ? (
        <Ionicons
          onPress={() =>
            setPlayer((prev) => {
              return { ...prev, playing: !prev.playing };
            })
          }
          name="pause"
          size={24}
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
          size={24}
          color="black"
        />
      )}
      <FontAwesome6 name="arrow-rotate-right" size={24} color="black" />
      <Ionicons name="play-skip-forward" size={24} color="black" />
    </View>
  );
};
