import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import BookLink from "@/components/book-link";
import { colors } from "@/components/ui/colors";
import { useLibraryStore } from "@/stores/library-store";

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
        <View className="flex grow items-center justify-center gap-2 px-4">
          <Text className="text-4xl font-bold text-white">
            Your library is empty
          </Text>
          <Text className="px-6 font-bold text-white">
            Please synchronize with your backend server to add library items
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="h-screen">
        <ScrollView className="px-2">
          <View className="flex flex-row flex-wrap gap-2">
            {libraryItems?.map((item) => (
              <BookLink key={item.id} item={item} />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
