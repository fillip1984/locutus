import { Pressable, Text, View } from "react-native";
import {
  TrackPlayer,
  useOnChangeTrack,
  useOnPlaybackStateChange,
} from "react-native-nitro-player";
import { Image } from "expo-image";
import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

export default function MiniPlayer() {
  // TODO: not sure how to appropriately use placement... waiting for more documentation to be made available
  // const placement = NativeTabs.BottomAccessory.usePlacement();
  const { state: playbackState } = useOnPlaybackStateChange();
  const { track: currentTrack } = useOnChangeTrack();

  // if (placement === "inline") {
  //   // Compact UI for inline placement
  //   return (
  //     <View>
  //       {playbackState === "playing" ? (
  //         <Ionicons
  //           onPress={() => TrackPlayer.pause()}
  //           name="pause"
  //           size={40}
  //           color="white"
  //         />
  //       ) : (
  //         <Ionicons
  //           onPress={() => TrackPlayer.play()}
  //           name="play-sharp"
  //           size={40}
  //           color="white"
  //         />
  //       )}
  //     </View>
  //   );
  // }

  // Full UI for regular placement
  return (
    <View className="flex-row gap-1">
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
        <View className="grow flex-row gap-1">
          <Image
            source={
              currentTrack?.artwork ? { uri: currentTrack.artwork } : undefined
            }
            style={{ width: 35, height: 35 }}
            contentFit="contain"
            transition={300}
          />
          {/* {placement === "regular" && ( */}
          <View className="w-66">
            <Text className="line-clamp-1 text-nowrap text-white">
              {currentTrack?.album}
            </Text>
            <Text className="line-clamp-1 text-nowrap text-white">
              {currentTrack?.title}
            </Text>
          </View>
          {/* )} */}
        </View>
      </Pressable>
      <Pressable>
        <View>
          {playbackState === "playing" ? (
            <Ionicons
              onPress={() => TrackPlayer.pause()}
              name="pause"
              size={40}
              color="white"
            />
          ) : (
            <Ionicons
              onPress={() => TrackPlayer.play()}
              name="play-sharp"
              size={40}
              color="white"
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}
