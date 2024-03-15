import { Text, View } from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";

export default function MinimizedAudioPlayer() {
  return (
    <View className="w-full">
      <View className="flex flex-row items-center gap-2 bg-slate-900 p-2">
        <View className="flex h-12 w-12 items-center justify-center rounded bg-slate-300">
          <Text>FSR</Text>
        </View>
        <View className="flex">
          <Text className="text-white">
            Scaling CSS at Heroky with Utility Classes
          </Text>
          <Text className="text-lg font-extrabold text-white">
            Full Stack Radio
          </Text>
        </View>
        <View className="flex flex-row gap-1">
          <FontAwesome6 name="headphones" size={24} color="white" />
          <Ionicons name="play-sharp" size={24} color="white" />
          <Ionicons onp name="pause" size={24} color="white" />
        </View>
      </View>
      <View className="relative w-full">
        <View className="absolute z-10 h-1 w-1/2 bg-white"></View>
        <View className="absolute h-1 w-full bg-slate-400"></View>
      </View>
    </View>
  );
}
