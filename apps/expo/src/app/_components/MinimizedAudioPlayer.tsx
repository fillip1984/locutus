import { Text, View } from "react-native";
import { FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";

import type { PlayerType } from "@acme/validators";

export default function MinimizedAudioPlayer({
  player,
}: {
  player: PlayerType;
}) {
  return (
    <View className="w-full">
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
            <FontAwesome6 name="headphones" size={24} color="white" />
            <MaterialIcons name="speaker" size={24} color="white" />
            <Ionicons name="play-sharp" size={24} color="white" />
            <Ionicons onp name="pause" size={24} color="white" />
          </View>
        </View>
      )}

      <View className="relative w-full">
        <View className="absolute z-10 h-1 w-1/2 bg-white"></View>
        <View className="absolute h-1 w-full bg-slate-400"></View>
      </View>
    </View>
  );
}
