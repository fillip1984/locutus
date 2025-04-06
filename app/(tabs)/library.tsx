import { Feather } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Pressable, SafeAreaView, Text, TextInput, View } from "react-native";

import BookLink from "../_components/BookLink";

import { LibraryItemSchemaType } from "@/db/schema";
import { LibraryItemSort, useLibraryStore } from "@/stores/libraryStore";

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
  const [search, setSearch] = useState("");
  const [audioBookFilter, setAudioBookFilter] = useState(false);
  const [eBookFilter, setEBookFilter] = useState(false);
  const [sort, setSort] = useState<LibraryItemSort>("Author");
  const handleSort = () => {
    switch (sort) {
      case "Author":
        setSort("Title");
        break;
      case "Title":
        setSort("Published");
        break;
      //      case "Published":
      //      setSort("Recent");
      //    break;
      default: // takes care of recent but also all other invalid states defaulting to author sort
        setSort("Author");
    }
  };

  const { refetch, libraryItems } = useLibraryStore();
  useFocusEffect(
    useCallback(() => {
      refetch({ search, sort, eBookFilter, audioBookFilter });
    }, [search, sort, eBookFilter, audioBookFilter]),
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
        <View className="px-1 py-2">
          <TextInput
            value={search}
            onChangeText={(text) => setSearch(text)}
            placeholder="Search..."
            className="mx-2 rounded bg-white p-2 text-xl text-black"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View className="mx-2 my-3 flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-3">
              <Pressable
                onPress={() => setEBookFilter((prev) => !prev)}
                className={`${eBookFilter ? "rounded-full bg-sky-600" : ""} p-1`}>
                <Feather name="book" size={20} color="white" />
              </Pressable>
              <Pressable
                onPress={() => setAudioBookFilter((prev) => !prev)}
                className={`${audioBookFilter ? "rounded-full bg-sky-600" : ""} p-1`}>
                <Feather name="volume-2" size={20} color="white" />
              </Pressable>
            </View>
            <Pressable
              onPress={handleSort}
              className="flex flex-row items-center gap-2">
              <Text className="text-white">{sort}</Text>
              <FontAwesome6 name="sort" size={24} color="white" />
            </Pressable>
          </View>
        </View>
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
