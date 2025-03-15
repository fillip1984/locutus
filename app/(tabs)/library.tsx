import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";

import BookLink from "../_components/BookLink";

import { LibraryItemSchemaType } from "@/db/schema";
import { useLibraryStore } from "@/stores/libraryStore";

export default function Library() {
  // const [items, setItems] = useState<Result[]>([]);
  // const [loading, setLoading] = useState(true);
  const itemsListRef = useRef<FlashList<LibraryItemSchemaType>>(null);

  // useFocusEffect(
  //   useCallback(() => {
  //     async function fetch() {
  //       setItems([]);
  //       const libraries = await getLibraries();
  //       for (const library of libraries) {
  //         const libraryItems = await getLibraryItems(library.id);
  //         setItems((prev) => prev.concat(libraryItems));
  //       }
  //       setLoading(false);
  //     }

  //     fetch();
  //   }, []),
  // );
  const { refetch, libraryItems } = useLibraryStore();
  useFocusEffect(
    useCallback(() => {
      refetch("Author");
    }, []),
  );

  // const track = useActiveTrack();

  // const libraryScrollViewRef = useRef<ScrollView>(null);

  // const bottomTabbarHeight = useBottomTabBarHeight();

  // useFocusEffect(() => {
  //   console.log({ bottomTabbarHeight });
  // });

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      {/* container */}
      <View className="flex h-full w-full bg-zinc-900">
        {/* {loading && (
          <View className="flex flex-1 items-center justify-center">
            <View className="animate-spin">
              <FontAwesome6 name="circle-notch" size={100} color="white" />
            </View>
          </View>
        )} */}

        {libraryItems && (
          <View className="flex flex-1">
            <View className="flex-1">
              <FlashList
                contentContainerStyle={{ padding: 8, paddingBottom: 30 }}
                ref={itemsListRef}
                estimatedItemSize={213}
                data={libraryItems}
                numColumns={2}
                // ItemSeparatorComponent={() => (
                //   <View style={{ height: 5, width: 10 }} />
                // )}
                renderItem={({ item }) => (
                  <BookLink key={item.id} item={item} />
                )}
                ListEmptyComponent={
                  <View className="flex flex-1 items-center justify-center">
                    <Text className="text-4xl text-white">
                      There are no library items
                    </Text>
                  </View>
                }
                ListFooterComponent={
                  libraryItems.length > 0 ? (
                    <View className="flex items-center justify-center py-8">
                      <Pressable
                        onPress={() =>
                          itemsListRef.current?.scrollToIndex({
                            index: 0,
                            animated: true,
                          })
                        }
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-400">
                        <FontAwesome6 name="arrow-up" size={36} color="white" />
                      </Pressable>
                    </View>
                  ) : null
                }
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
