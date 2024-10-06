import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { LibraryItemSchemaType } from "@/db/schema";

export default function BookLink({ item }: { item: LibraryItemSchemaType }) {
  return (
    <Link key={item.id} href={`/(media)/${item.id}`}>
      <View className="flex h-[285px] w-[192px]">
        <View className="overflow-hidden rounded-xl">
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
        </View>
        <Text className="line-clamp-1 font-bold text-white">{item.title}</Text>
        <Text className="line-clamp-1 text-white/80">{item.authorName}</Text>
        <View className="flex flex-row gap-2">
          {item.numAudioFiles > 0 && (
            <View className="flex flex-row items-center gap-1">
              <Feather name="volume-2" size={20} color="white" />
              {/* <View className="relative flex-1">
                <View className="h-2 rounded bg-gray-400" />
                <View
                  className="absolute left-0 h-2 rounded bg-yellow-400"
                  style={{ width: "0%" }}
                />
              </View> */}
            </View>
          )}
          <View className="flex flex-row items-center gap-1">
            {item.ebookFileFormat && (
              <Feather name="book" size={20} color="white" />
            )}
            {/* {item.ebookFileFormat && item.lastEBookId ? ( */}
            {/* // <Feather name="book-open" size={20} color="white" /> */}
            {/* ) : ( */}
            {/* <Feather name="book" size={20} color="white" /> */}
            {/* )} */}

            {/* <View className="relative flex-1">
              <View className="h-2 rounded bg-gray-400" />
              <View
                className="absolute left-0 h-2 rounded bg-yellow-400"
                style={{ width: "0%" }}
              />
            </View> */}
          </View>
        </View>
      </View>
    </Link>
  );
}