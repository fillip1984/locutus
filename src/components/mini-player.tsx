import { Pressable, Text, View } from "react-native";
import {
  TrackItem,
  TrackPlayer,
  TrackPlayerState,
} from "react-native-nitro-player";
import { Image } from "expo-image";
import { router } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "./ui/colors";

export default function MiniPlayer({
  currentTrack,
  playbackState,
}: {
  currentTrack: TrackItem | null;
  playbackState: TrackPlayerState;
}) {
  // TODO: not sure how to appropriately use placement... waiting for more documentation to be made available
  const placement = NativeTabs.BottomAccessory.usePlacement();

  // Full UI for regular placement
  return (
    <View className="flex-row gap-1 px-4 py-2">
      <Pressable
        onPress={() =>
          router.push({
            pathname: `/player/[id]`,
            params: {
              id: currentTrack?.extraPayload?.libraryItemId as string,
              mode: "resume",
            },
          })
        }
        className="flex flex-row items-center gap-2"
      >
        <View className="grow flex-row items-center gap-1">
          <Image
            source={
              currentTrack?.artwork ? { uri: currentTrack.artwork } : undefined
            }
            style={{
              width: 35,
              height: 35,
              borderRadius: 8,
              backgroundColor: colors.foreground,
            }}
            contentFit="contain"
            transition={300}
          />
          {/* TODO: check if there's a better way to size this */}
          <View className={`${placement === "regular" ? "w-64" : "w-32"}`}>
            <Text className="line-clamp-1 font-bold text-nowrap text-white">
              {currentTrack?.album}
            </Text>
            <Text className="line-clamp-1 text-xs text-nowrap text-white/80">
              {currentTrack?.title}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable className="shrink-0">
        <View>
          {playbackState === "playing" ? (
            <Ionicons
              onPress={() => TrackPlayer.pause()}
              name="pause"
              size={30}
              color="white"
            />
          ) : (
            <Ionicons
              onPress={() => TrackPlayer.play()}
              name="play-sharp"
              size={30}
              color="white"
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}
