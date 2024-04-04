import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import BookLink from "@/components/BookLink";
import { useLibraryStore } from "@/stores/libraryStore";

export default function Libraries() {
  const libraryStore = useLibraryStore();
  useEffect(() => {
    libraryStore.refetch();
  }, []);

  const libraryScrollViewRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen bg-slate-800 p-2">
        {libraryStore.libraryItems?.length === 0 && (
          <View className="flex h-screen items-center justify-center">
            <Text className="text-2xl text-white">Nothing to play</Text>
          </View>
        )}

        {libraryStore.libraryItems && libraryStore.libraryItems.length > 0 && (
          <ScrollView ref={libraryScrollViewRef}>
            <View className="mt-6 flex flex-row flex-wrap gap-4">
              {libraryStore.libraryItems.map((item) => (
                <BookLink key={item.id} item={item} />
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
