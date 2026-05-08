// import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";

import { libraryItemSchemaType } from "@/db/schema";
import { colors } from "./ui/colors";

export default function BookLink({ item }: { item: libraryItemSchemaType }) {
  return (
    <Link href={`/media/${item.id}`}>
      <View className="w-30">
        <Image
          source={item.coverArtPath}
          style={{
            backgroundColor: colors.foreground,
            borderRadius: 8,
            width: 120,
            height: 192,
          }}
          contentFit="cover"
          transition={300}
        />

        <Text className="line-clamp-1 font-bold text-white">{item.title}</Text>
        <Text className="line-clamp-1 text-white/80">{item.authorNameLF}</Text>
        <View className="flex flex-row gap-2">
          <View className="flex w-full flex-row items-center gap-1">
            <Text className="mr-auto text-white">
              {item.publishedYear ?? "Unknown"}
            </Text>
            {/* {item.numAudioFiles > 0 && (
              <Feather name="volume-2" size={20} color="white" />
            )}
            {item.ebookFileFormat && (
              <Feather name="book" size={20} color="white" />
            )} */}
          </View>
        </View>
      </View>
    </Link>
  );
}
