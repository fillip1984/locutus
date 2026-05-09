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
import { Marquee } from "./ui/marquee-text";

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
    <View className="grow flex-row items-center justify-between px-4 py-2">
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
        className="flex flex-row items-center"
      >
        <Image
          source={
            currentTrack?.artwork ? { uri: currentTrack.artwork } : undefined
          }
          style={{
            width: 35,
            height: 35,
            borderRadius: 8,
            backgroundColor: colors.foreground,
            marginRight: 4,
          }}
          contentFit="contain"
          transition={300}
        />
        {/* TODO: check if there's a better way to size this */}
        <View
          className={`-mt-4 grow ${placement === "regular" ? "max-w-4/5" : "max-w-2/3"}`}
        >
          <Text className="line-clamp-1 font-bold text-nowrap text-white">
            {currentTrack?.album}
          </Text>
          <Marquee spacing={40} speed={0.6} delay={3000}>
            <Text className="text-xs text-white/80">{currentTrack?.title}</Text>
          </Marquee>
        </View>
      </Pressable>

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
    </View>
  );
}
