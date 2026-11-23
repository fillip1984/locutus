import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect } from "expo-router";

import BookLink from "@/components/book-link";
import { colors } from "@/components/ui/colors";
import { useLibraryStore } from "@/stores/library-store";

export default function SearchIndex() {
  const { refetch, libraryItems } = useLibraryStore();
  const [filteredLibraryItems, setFilteredLibraryItems] =
    useState(libraryItems);
  const [searchText, setSearchText] = useState("");

  useFocusEffect(
    useCallback(() => {
      refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    // TODO: debounce this
    if (searchText === "") {
      setFilteredLibraryItems(libraryItems);
    } else {
      const filtered =
        libraryItems?.filter(
          (item) =>
            item.title.toLowerCase().includes(searchText.toLowerCase()) ||
            item.authorName.toLowerCase().includes(searchText.toLowerCase()),
        ) ?? [];
      setFilteredLibraryItems(filtered);
    }
  }, [searchText, libraryItems]);

  return (
    <>
      <Stack.SearchBar
        placement="automatic"
        placeholder="Search"
        autoFocus
        obscureBackground
        onChangeText={(e) => setSearchText(e.nativeEvent.text)}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="h-screen pb-16">
          <ScrollView className="px-2">
            {filteredLibraryItems?.length === 0 ? (
              <View className="mt-24 flex grow items-center justify-center gap-2 px-4">
                <Text className="text-4xl font-bold text-white">
                  No results
                </Text>
                <Text className="px-6 font-bold text-white">
                  There are no library items that match your search query...
                </Text>
              </View>
            ) : (
              <View className="flex flex-row flex-wrap gap-2">
                {filteredLibraryItems?.map((item) => (
                  <BookLink key={item.id} item={item} />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}
