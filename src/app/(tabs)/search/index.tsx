import BookLink from "@/components/book-link";
import { colors } from "@/components/ui/colors";
import { useLibraryStore } from "@/stores/library-store";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  // const handleSearch = (text: string) => {
  //   if (text === "") {
  //     setFilteredLibraryItems(libraryItems);
  //   } else {
  //     const filtered =
  //       libraryItems?.filter(
  //         (item) =>
  //           item.title.toLowerCase().includes(text.toLowerCase()) ||
  //           item.authorName.toLowerCase().includes(text.toLowerCase()),
  //       ) ?? [];
  //     setFilteredLibraryItems(filtered);
  //   }
  // };

  return (
    <>
      <Stack.SearchBar
        placement="automatic"
        placeholder="Search"
        onChangeText={(e) => setSearchText(e.nativeEvent.text)}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView className="px-2">
          {filteredLibraryItems?.length === 0 ? (
            <View className="flex mt-24 px-4 grow justify-center items-center gap-2">
              <Text className="text-4xl font-bold text-white">No results</Text>
              <Text className="font-bold text-white px-6">
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
      </SafeAreaView>
    </>
  );
}
