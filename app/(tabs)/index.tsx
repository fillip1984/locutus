import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { localDb } from "@/db";
import { LibraryItemSchemaType, libraryItemSchema } from "@/db/schema";

export default function TabOneScreen() {
  const [libraryItems, setLibraryItems] = useState<
    LibraryItemSchemaType[] | null
  >();

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        console.log("refetching library items");
        const result = await localDb.select().from(libraryItemSchema);
        result.forEach((i) => console.log(i.coverArtPath));
        setLibraryItems(result);
      };

      fetchData();
    }, []),
  );

  const libraryScrollViewRef = useRef<ScrollView>(null);
  const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen bg-slate-800 p-2">
        <ScrollView ref={libraryScrollViewRef}>
          <View className="mt-6 flex flex-row flex-wrap gap-4">
            {libraryItems?.map((item) => (
              <Link
                // className="h-60 w-36"
                key={item.id}
                href={`/(media)/${item.id}`}>
                <View key={item.id} className="flex h-60 w-36">
                  <Image
                    key={item.id}
                    source={item.coverArtPath}
                    style={{ flex: 1 }}
                    placeholder={blurhash}
                    contentFit="cover"
                    transition={1000}
                  />
                  <Text className="text-white">{item.title}</Text>
                </View>
              </Link>
            ))}
          </View>
          <View className="flex items-center justify-center pb-[600px]">
            <Pressable
              onPress={() => libraryScrollViewRef.current?.scrollTo({ y: 0 })}
              className="mt-8">
              <FontAwesome name="arrow-circle-up" size={48} color="white" />
            </Pressable>
          </View>
        </ScrollView>
        <View />
      </View>
    </SafeAreaView>
  );
}
