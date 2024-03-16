import type { Dispatch, SetStateAction } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { PlayerType } from "@acme/validators";

export default function MinimizedAudioPlayer({
  player,
  setPlayer,
}: {
  player: PlayerType;
  setPlayer: Dispatch<SetStateAction<PlayerType>>;
}) {
  return (
    <View className="my-8 w-full">
      {player.source && (
        <View className="flex flex-row items-center justify-between gap-2 bg-slate-900 p-2">
          <View className="flex flex-row gap-2">
            <View className="flex h-12 w-12 items-center justify-center rounded bg-slate-300">
              <Text>FSR</Text>
            </View>
            <View className="flex">
              <Text className="text-white">{player.source.title}</Text>
              <Text className="text-lg font-extrabold text-white">
                Full Stack Radio
              </Text>
            </View>
          </View>
          <View className="flex flex-row gap-1">
            {/* <FontAwesome6 name="headphones" size={24} color="white" /> */}
            {/* <MaterialIcons name="speaker" size={24} color="white" /> */}
            {player.playing ? (
              <Ionicons
                onPress={() =>
                  setPlayer((prev) => {
                    return { ...prev, playing: !prev.playing };
                  })
                }
                name="pause"
                size={24}
                color="white"
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
                color="white"
              />
            )}
          </View>
        </View>
      )}

      <View className="relative w-full">
        {/* TODO: progress slide is not smooth at all and the knob may overshoot the end */}
        <View
          className="absolute z-10 h-1 bg-white"
          style={{ width: `${player.percentComplete ?? 0}%` }}></View>
        <View className="absolute h-1 w-full bg-slate-400"></View>
      </View>
    </View>
  );
}
