import { Pressable, Text, View } from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";

export default function AudioPlayer() {
  return (
    <View className="flex w-full rounded bg-slate-900">
      <TrackInfo />
      <TrackProgress />
      <Controls />
    </View>
  );
}

const TrackInfo = () => {
  return (
    <View className="flex flex-row items-center gap-4 p-4">
      <View className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-300">
        <Text className="text-black">FSR</Text>
      </View>
      <View className="flex gap-2">
        <Text className="font-semibold text-sky-300">Ep. 128</Text>
        <Text className="font-bold text-slate-300">
          Scaling CSS at Heroky with Utility Classes
        </Text>
        <Text className="text-lg font-extrabold text-white">
          Full Stack Radio
        </Text>
      </View>
    </View>
  );
};

const TrackProgress = () => {
  return (
    <View className="flex gap-4 p-4">
      <View className="relative">
        <View className="absolute z-10 h-2 w-1/3 rounded-lg bg-sky-300"></View>
        <View className="absolute h-2 w-full rounded-lg bg-slate-500"></View>
      </View>
      <View className="flex flex-row justify-between">
        <Text className="text-sky-300">24:15</Text>
        <Text className="text-slate-300">75:50</Text>
      </View>
    </View>
  );
};

const Controls = () => {
  return (
    <View className="flex flex-row justify-evenly rounded-b bg-slate-400 p-2">
      <Ionicons name="bookmark-outline" size={24} color="black" />
      <Ionicons name="play-skip-back-sharp" size={24} color="black" />
      <Pressable className="rotate-180 -scale-y-100">
        <Ionicons name="refresh-outline" size={24} color="black" />
      </Pressable>
      <Ionicons name="play-sharp" size={24} color="black" />
      <Ionicons name="pause" size={24} color="black" />
      <FontAwesome6 name="arrow-rotate-right" size={24} color="black" />
      <Ionicons name="refresh-outline" size={24} color="black" />
      <Ionicons name="play-skip-forward" size={24} color="black" />
    </View>
  );
};
