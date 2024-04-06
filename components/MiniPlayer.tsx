import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import TrackPlayer, {
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
} from "react-native-track-player";

import { calc } from "@/app/(media)/[id]";
import { LibraryItemSchemaType } from "@/db/schema";
import { fetchLibraryItemFromTrack } from "@/services/playbackService";

export default function MiniPlayer() {
  const [libraryItem, setLibraryItem] = useState<
    LibraryItemSchemaType | undefined
  >();
  const track = useActiveTrack();
  const progress = useProgress();
  const { state: playbackState } = usePlaybackState();

  useEffect(() => {
    const fetchData = async () => {
      if (track) {
        const result = (await fetchLibraryItemFromTrack(
          track.id,
        )) as LibraryItemSchemaType;
        if (result) {
          setLibraryItem(result);
        }
      }
    };

    fetchData();
  }, [track]);
  return (
    <View className="relative flex w-full">
      <Pressable
        onPress={() => router.push(`/(player)/${libraryItem?.id}`)}
        className="flex flex-row items-center gap-2 p-4">
        {/* TODO: not sure what I'm fighting, either expo or nativewind but this worked and then didn't... */}
        <View className="flex">
          <Image
            source={track?.artwork}
            style={{ flex: 1 }}
            contentFit="cover"
          />
        </View>
        <View>
          {/* TODO: make text scroll left and right */}
          <Text className="font-bold text-white">{track?.title}</Text>
          <Text className="text-white">{track?.artist}</Text>
        </View>

        <View className="ml-auto mr-2">
          {playbackState === State.Playing ? (
            <Ionicons
              onPress={TrackPlayer.pause}
              name="pause"
              size={30}
              color="white"
            />
          ) : (
            <Ionicons
              onPress={TrackPlayer.play}
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
          width: `${calc(progress.position, track?.duration ?? 1)}%`,
        }}
      />
    </View>
  );
}
