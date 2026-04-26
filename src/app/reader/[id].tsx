import { colors } from "@/components/ui/colors";
import { db } from "@/db";
import { libraryItemWithFilesSchemaType } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";

import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Player() {
  const {
    id: libraryItemId,
    eBookFileId,
    mode,
  } = useLocalSearchParams<{
    id: string;
    eBookFileId: string;
    mode: "read" | "resume";
  }>();
  const [libraryItem, setLibraryItem] =
    useState<libraryItemWithFilesSchemaType | null>(null);
  useEffect(() => {
    const fetchLibraryItem = async () => {
      const libraryItem = await db.query.libraryItemSchema.findFirst({
        where: {
          id: libraryItemId,
        },
        with: {
          audioFiles: true,
          eBookFiles: true,
        },
      });
      if (!libraryItem) {
        console.error("Library item not found");
        return;
      }
      setLibraryItem(libraryItem);
    };

    if (libraryItemId) {
      fetchLibraryItem();
    }
  }, [libraryItemId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TopActionsBar />
      <View className="flex h-full gap-2 p-2">
        <Stack.Screen options={{ gestureDirection: "vertical" }} />
        <Text className="text-white">Reader for {libraryItem?.title}</Text>
      </View>
    </SafeAreaView>
  );
}

const TopActionsBar = () => {
  return (
    <View className="mt-12 ml-2">
      <Link href="..">
        {/* TODO: swipe down to dismiss, should animate down like a modal, back to where we came from, swipe left and right to go back and forward through tracks */}
        <Ionicons name="chevron-down" size={24} color="white" />
      </Link>
    </View>
  );
};
