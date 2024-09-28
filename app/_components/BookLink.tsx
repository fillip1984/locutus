import { Image } from "expo-image";
import { Link } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { LibraryItemSchemaType } from "@/db/schema";

export default function BookLink({ item }: { item: LibraryItemSchemaType }) {
  return (
    <Link href={`/(media)/${item.id}`}>
      <View key={item.id} className="flex h-60 w-36">
        <Image
          source={item.coverArtPath}
          style={{ flex: 1 }}
          contentFit="cover"
          transition={300}
        />
        <Text className="text-white">{item.title}</Text>
      </View>
    </Link>
  );
}
