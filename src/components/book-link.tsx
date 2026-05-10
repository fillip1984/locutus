import React from "react";
import { Pressable, Text, View } from "react-native";
import { useNowPlaying } from "react-native-nitro-player";
import { Image } from "expo-image";
import { router } from "expo-router";

import { libraryItemSchemaType } from "@/db/schema";
import { colors } from "./ui/colors";

export default function BookLink({ item }: { item: libraryItemSchemaType }) {
  const { currentTrack, currentState } = useNowPlaying();

  const isPlayable = () => {
    return !isResumable() && item.isAudiobook && item.downloaded;
  };

  const isResumable = () => {
    return (
      item.id === currentTrack?.extraPayload?.libraryItemId &&
      currentState === "playing"
    );
  };

  const handlePlayOrShow = () => {
    if (isResumable() || isPlayable()) {
      router.push({
        pathname: `/player/[id]`,
        params: {
          id: item.id,
          audiobookLocation: item.audiobookLocation,
          mode: isResumable() ? "resume" : "play",
        },
      });
    } else {
      router.push({
        pathname: `/media/[id]`,
        params: {
          id: item.id,
        },
      });
    }
  };

  return (
    <Pressable onPress={handlePlayOrShow} className="w-30">
      <Image
        source={item.coverArtPath}
        style={{
          backgroundColor: colors.foreground,
          borderRadius: 8,
          width: 120,
          height: 192,
        }}
        contentFit="contain"
        transition={300}
      />

      <Text className="line-clamp-1 font-bold text-white">{item.title}</Text>
      <Text className="line-clamp-1 text-white/80">{item.authorNameLF}</Text>
      <View className="flex flex-row gap-2">
        <View className="flex w-full flex-row items-center gap-1">
          <Text className="mr-auto text-white">
            {item.publishedYear ?? "Unknown"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
