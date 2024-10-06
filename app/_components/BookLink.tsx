import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { LibraryItemSchemaType } from "@/db/schema";

export default function BookLink({ item }: { item: LibraryItemSchemaType }) {
  return (
    <Link href={`/(media)/${item.id}`}>
      <View className="flex h-[268px] w-[192px]">
        <Image
          source={item.coverArtPath}
          style={{
            objectFit: "fill",
            overflow: "hidden",
            width: 192,
            height: 192,
          }}
          contentFit="fill"
          transition={300}
        />
        <Text className="line-clamp-1 font-bold text-white">{item.title}</Text>
        <Text className="line-clamp-1 text-white/80">{item.authorName}</Text>
        <View className="flex flex-row gap-2">
          {item.numAudioFiles > 0 && (
            <Feather name="volume-2" size={20} color="white" />
          )}
          {item.ebookFileFormat && (
            <Feather name="book" size={20} color="white" />
          )}
          {/* <Feather name="book-open" size={24} color="white" /> */}
        </View>
      </View>
    </Link>
  );
}
