import BookLink from "@/components/book-link";
import { colors } from "@/components/ui/colors";
import { useLibraryStore } from "@/stores/library-store";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LibraryPage() {
  const { refetch, libraryItems } = useLibraryStore();

  const [isViewEmpty, setIsViewEmpty] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    if (libraryItems?.length === 0) {
      setIsViewEmpty(true);
    } else {
      setIsViewEmpty(false);
    }
  }, [libraryItems]);

  if (isViewEmpty) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex px-4 grow justify-center items-center gap-2">
          <Text className="text-4xl font-bold text-white">
            Your library is empty
          </Text>
          <Text className="font-bold text-white px-6">
            Please synchronize with your backend server to add library items
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView className="px-2">
        <View className="flex flex-row flex-wrap gap-2">
          {libraryItems?.map((item) => (
            <BookLink key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
