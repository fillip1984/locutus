import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  TrackPlayer,
  useOnChangeTrack,
  useOnPlaybackStateChange,
} from "react-native-nitro-player";
import { Image } from "expo-image";
import { router } from "expo-router";
import { NativeTabs } from "expo-router/build/native-tabs";

import { Ionicons } from "@expo/vector-icons";

export default function MiniPlayer({
  isPlaying,
  onToggle,
}: {
  isPlaying: boolean;
  onToggle: () => void;
}) {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const { state: playbackState } = useOnPlaybackStateChange();
  const { track: currentTrack } = useOnChangeTrack();

  //   if (placement === "inline") {
  //     // Compact UI for inline placement
  //     return (
  //       <Pressable onPress={onToggle} style={styles.inlinePlayer}>
  //         <Text className="text-white">{isPlaying ? "⏸" : "▶"}</Text>
  //       </Pressable>
  //     );
  //   }

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
            contentFit="fill"
            transition={1000}
          />
          <View className="w-66">
            <Text className="line-clamp-1 text-nowrap text-white">
              {currentTrack?.album}
            </Text>
            <Text className="line-clamp-1 text-nowrap text-white">
              {currentTrack?.title}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable onPress={onToggle}>
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

const styles = StyleSheet.create({
  inlinePlayer: {
    padding: 8,
  },
  regularPlayer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
});

// // import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
// import { router } from "expo-router";
// import { useEffect, useState } from "react";
// import { Pressable, Text, View } from "react-native";
// import TrackPlayer, {
//   State,
//   useActiveTrack,
//   usePlaybackState,
//   useProgress,
// } from "react-native-track-player";

// import { calc } from "@/app/(media)/[id]";
// import { LibraryItemSchemaType } from "@/db/schema";
// import { fetchLibraryItemFromTrack } from "@/services/playbackService";

// export default function MiniPlayer() {
//   const [libraryItem, setLibraryItem] = useState<
//     LibraryItemSchemaType | undefined
//   >();
//   const track = useActiveTrack();
//   const progress = useProgress();
//   const { state: playbackState } = usePlaybackState();

//   useEffect(() => {
//     const fetchData = async () => {
//       if (track) {
//         const result = (await fetchLibraryItemFromTrack(
//           track.id,
//         )) as LibraryItemSchemaType;
//         if (result) {
//           setLibraryItem(result);
//         }
//       }
//     };

//     fetchData();
//   }, [track]);
//   return (
//     <View className="relative flex w-full">
//       <Pressable
//         onPress={() => router.push(`/(player)/${libraryItem?.id}`)}
//         className="flex flex-row items-center gap-2 p-4">
//         {/* TODO: not sure what I'm fighting, either expo or nativewind but this worked and then didn't... now using styles */}
//         <View style={{ width: 40, height: 40 }}>
//           <Image
//             source={track?.artwork}
//             style={{ flex: 1 }}
//             contentFit="cover"
//           />
//         </View>
//         <View>
//           {/* TODO: make text scroll left and right */}
//           <Text className="font-bold text-white">{track?.title}</Text>
//           <Text className="text-white">{track?.artist}</Text>
//         </View>

//         <View className="ml-auto mr-2">
//           {playbackState === State.Playing ? (
//             <Text className="text-white">Playing</Text>
//           ) : (
//             // <Ionicons
//             //   onPress={TrackPlayer.pause}
//             //   name="pause"
//             //   size={30}
//             //   color="white"
//             // />
//             <Text className="text-white">Paused</Text>
//             // <Ionicons
//             //   onPress={TrackPlayer.play}
//             //   name="play-sharp"
//             //   size={30}
//             //   color="white"
//             // />
//           )}
//         </View>
//       </Pressable>

//       <View
//         className="absolute bottom-0 h-1 rounded-b bg-yellow-300"
//         style={{
//           width: `${calc(progress.position, track?.duration ?? 1)}%`,
//         }}
//       />
//     </View>
//   );
// }
