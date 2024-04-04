import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import TrackPlayer, {
  State,
  useActiveTrack,
  usePlaybackState,
} from "react-native-track-player";

import { calc } from "@/app/(media)/[id]";

export default function MiniPlayer() {
  const track = useActiveTrack();
  const { state: playbackState } = usePlaybackState();
  return (
    <View className="absolute bottom-20 left-0 right-0">
      <View className="relative flex w-full">
        <View className="flex w-full flex-row items-center justify-between">
          <View className="flex p-2">
            <Text className="font-bold text-white">{track?.title}</Text>
            <Text className="text-white">{track?.artist}</Text>
          </View>

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
        </View>
        <View
          className="absolute bottom-0 h-1 rounded-b bg-yellow-300"
          style={{
            width: `${calc(1000, track?.duration ?? 1)}%`,
          }}
        />
      </View>
    </View>
  );
}
