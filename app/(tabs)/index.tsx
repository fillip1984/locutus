import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { useLibraryState } from "@/stores/libraryStore";

export default function TabOneScreen() {
  const libraryState = useLibraryState();
  useEffect(() => {
    libraryState.refetch();
  }, []);

  const libraryScrollViewRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen bg-slate-800 p-2">
        {libraryState.libraryItems?.length === 0 && (
          <View className="flex h-screen items-center justify-center">
            <Text className="text-2xl text-white">Nothing to play</Text>
          </View>
        )}

        {libraryState.libraryItems && libraryState.libraryItems.length > 0 && (
          <ScrollView ref={libraryScrollViewRef}>
            <View className="mt-6 flex flex-row flex-wrap gap-4">
              {libraryState.libraryItems.map((item) => (
                <Link key={item.id} href={`/(media)/${item.id}`}>
                  <View key={item.id} className="flex h-60 w-36">
                    <Image
                      key={item.id}
                      source={item.coverArtPath}
                      style={{ flex: 1 }}
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
        )}
        <View />
      </View>
    </SafeAreaView>
  );
}
