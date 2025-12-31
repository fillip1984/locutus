import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { LibraryItemSchemaType } from "@/db/schema";

export default function BookLink({ item }: { item: LibraryItemSchemaType }) {
  return (
    <Link key={item.id} href={`/(media)/${item.id}`}>
      <View className="flex h-[265px] w-[172px]">
        <View className="overflow-hidden rounded-xl">
          <Image
            source={item.coverArtPath}
            style={{
              objectFit: "fill",
              overflow: "hidden",
              width: 172,
              height: 172,
            }}
            contentFit="fill"
            transition={300}
          />
        </View>
        <Text className="line-clamp-1 font-bold text-white">{item.title}</Text>
        <Text className="line-clamp-1 text-white/80">{item.authorNameLF}</Text>
        <View className="flex flex-row gap-2">
          <View className="flex w-full flex-row items-center gap-1">
            <Text className="mr-auto text-white">
              {item.publishedYear ?? "Unknown"}
            </Text>
            {item.numAudioFiles > 0 && (
              <Feather name="volume-2" size={20} color="white" />
            )}
            {item.ebookFileFormat && (
              <Feather name="book" size={20} color="white" />
            )}
          </View>
        </View>
      </View>
    </Link>
  );
}
