import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useActiveTrack } from "react-native-track-player";

import BookLink from "@/components/BookLink";
import MiniPlayer from "@/components/MiniPlayer";
import { useLibraryStore } from "@/stores/libraryStore";

export default function Libraries() {
  const libraryStore = useLibraryStore();
  useEffect(() => {
    libraryStore.refetch();
  }, []);

  const track = useActiveTrack();

  const libraryScrollViewRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="relative">
        <View className="flex h-screen bg-slate-800 p-2">
          {libraryStore.libraryItems?.length === 0 && (
            <View className="flex h-screen items-center justify-center">
              <Text className="text-2xl text-white">Nothing to play</Text>
            </View>
          )}

          {libraryStore.libraryItems &&
            libraryStore.libraryItems.length > 0 && (
              <ScrollView ref={libraryScrollViewRef}>
                <View className="mt-6 flex flex-row flex-wrap gap-4">
                  {libraryStore.libraryItems.map((item) => (
                    <BookLink key={item.id} item={item} />
                  ))}
                </View>
                <View className="flex items-center justify-center pb-[600px]">
                  <Pressable
                    onPress={() =>
                      libraryScrollViewRef.current?.scrollTo({ y: 0 })
                    }
                    className="mt-8">
                    <FontAwesome
                      name="arrow-circle-up"
                      size={48}
                      color="white"
                    />
                  </Pressable>
                </View>
              </ScrollView>
            )}
          <View />
        </View>
        {/* TODO: not sure why, but I have to declare bg color here for it to take effect */}
        {/* TODO: Couldn't find a better way to afix to the bottom, try flex methods maybe? */}
        {track && (
          <View className="absolute bottom-36 left-0 right-0 bg-slate-900">
            <MiniPlayer />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
