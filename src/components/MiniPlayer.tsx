import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { calc } from "@/app/(media)/[id]";
import { LibraryItemSchemaType } from "@/db/schema";
import {
  fetchLibraryItemFromTrack,
  useTrackPlayer,
} from "@/stores/trackPlayerStore";
import { useAudioPlayerStatus } from "expo-audio";

export default function MiniPlayer() {
  const [libraryItem, setLibraryItem] = useState<
    LibraryItemSchemaType | undefined
  >();
  // const track = useActiveTrack();
  // const progress = useProgress();
  // const { state: playbackState } = usePlaybackState();
  const { activeTrack, play, pause, _player } = useTrackPlayer();
  const { currentTime, duration, playing } = useAudioPlayerStatus(_player);

  useEffect(() => {
    const fetchData = async () => {
      if (activeTrack) {
        const result = (await fetchLibraryItemFromTrack(
          activeTrack.id,
        )) as LibraryItemSchemaType;
        if (result) {
          setLibraryItem(result);
        }
      }
    };

    fetchData();
  }, [activeTrack]);
  return (
    <View className="relative flex w-full">
      <Pressable
        onPress={() => router.push(`/(player)/${libraryItem?.id}`)}
        className="flex flex-row items-center gap-2 p-4"
      >
        {/* TODO: not sure what I'm fighting, either expo or nativewind but this worked and then didn't... now using styles */}
        <View style={{ width: 40, height: 40 }}>
          <Image
            source={activeTrack?.artwork}
            style={{ flex: 1 }}
            contentFit="cover"
          />
        </View>
        <View>
          {/* TODO: make text scroll left and right */}
          <Text className="font-bold text-white">{activeTrack?.title}</Text>
          <Text className="text-white">{activeTrack?.artist}</Text>
        </View>

        <View className="mr-2 ml-auto">
          {playing ? (
            <Ionicons onPress={pause} name="pause" size={30} color="white" />
          ) : (
            <Ionicons
              onPress={play}
              name="play-sharp"
              size={30}
              color="white"
            />
          )}
        </View>
      </Pressable>

      <View
        className="absolute bottom-0 h-1 rounded-b bg-yellow-300"
        style={{
          width: `${calc(currentTime, duration ?? 1)}%`,
        }}
      />
    </View>
  );
}
