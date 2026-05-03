import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import LibraryShelf from "@/components/book-shelf";
import { colors } from "@/components/ui/colors";
import { libraryItemSchemaType } from "@/db/schema";
import { useLibraryStore } from "@/stores/library-store";

export default function RecentPage() {
  const libraryStore = useLibraryStore();

  const [continueItems, setContinueItems] = useState<libraryItemSchemaType[]>(
    [],
  );
  const [newItems, setNewItems] = useState<libraryItemSchemaType[]>([]);
  const [downloadedItems, setDownloadedItems] = useState<
    libraryItemSchemaType[]
  >([]);
  const [revisitItems, setRevisitItems] = useState<libraryItemSchemaType[]>([]);

  const [isViewEmpty, setIsViewEmpty] = useState(false);

  useFocusEffect(
    useCallback(() => {
      libraryStore.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    async function initView() {
      // if (
      //   libraryStore.status === "loaded" &&
      //   (libraryStore.libraries === undefined ||
      //     libraryStore.libraries?.length === 0)
      // ) {
      //   const result = await db.select().from(userSettingsSchema);
      //   console.log("syncing libraries");
      //   await libraryStore.syncWithServer();
      //   if (result[0] && result[0].lastServerSync) {
      //     const serverProgressUpdates = await getProgressFromServer(
      //       result[0].lastServerSync,
      //     );
      //     for (const media of serverProgressUpdates) {
      //       downloadStore.add(media.libraryItemId);
      //     }
      //     downloadStore.download();
      //   }
      // }

      setContinueItems(
        libraryStore.libraryItems
          ?.filter((i) => !i.complete && (i.lastPlayedId || i.lastEBookId))
          ?.sort((a, b) => {
            const aLastPlayed = a.lastPlayedId
              ? (a.updatedAt?.getTime() ?? 0)
              : 0;
            const bLastPlayed = b.lastPlayedId
              ? (b.updatedAt?.getTime() ?? 0)
              : 0;
            return bLastPlayed - aLastPlayed;
          })
          .slice(0, 20) ?? [],
      );
      setDownloadedItems(
        libraryStore.libraryItems
          ?.filter((i) => i.downloaded)
          ?.sort((a, b) => {
            if (a.updatedAt && b.updatedAt) {
              return (
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
              );
            } else if (a.updatedAt && !b.updatedAt) {
              return -1;
            } else if (!a.updatedAt && b.updatedAt) {
              return 1;
            } else {
              return 0;
            }
          })
          .slice(0, 20) ?? [],
      );
      setRevisitItems(
        libraryStore.libraryItems
          ?.filter((i) => i.complete)
          ?.sort((a, b) => {
            if (a.updatedAt && b.updatedAt) {
              return (
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
              );
            } else if (a.updatedAt && !b.updatedAt) {
              return -1;
            } else if (!a.updatedAt && b.updatedAt) {
              return 1;
            } else {
              return 0;
            }
          })
          .slice(0, 20) ?? [],
      );
      setNewItems(
        libraryStore.libraryItems
          ?.filter(
            (i) =>
              !i.complete && !i.downloaded && !i.lastPlayedId && !i.lastEBookId,
          )
          ?.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            } else if (a.createdAt && !b.createdAt) {
              return -1;
            } else if (!a.createdAt && b.createdAt) {
              return 1;
            } else {
              return 0;
            }
          })
          .slice(0, 20) ?? [],
      );
    }

    if (libraryStore.status === "loaded") {
      initView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryStore.status]);

  useEffect(() => {
    setIsViewEmpty(
      continueItems.length === 0 &&
        newItems.length === 0 &&
        downloadedItems.length === 0 &&
        revisitItems.length === 0,
    );
  }, [continueItems, newItems, downloadedItems, revisitItems]);

  if (isViewEmpty) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex grow items-center justify-center gap-2">
          <Text className="text-4xl font-bold text-white">No recent items</Text>
          <Text className="text-xl font-bold text-white">
            Please visit your library
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView className="px-2">
        <View className="flex gap-4">
          {continueItems && continueItems.length > 0 && (
            <LibraryShelf label="Continue" items={continueItems} />
          )}

          {downloadedItems && downloadedItems.length > 0 && (
            <LibraryShelf label="Downloaded" items={downloadedItems} />
          )}

          {newItems && newItems.length > 0 && (
            <LibraryShelf label="New" items={newItems} />
          )}

          {revisitItems && revisitItems.length > 0 && (
            <LibraryShelf label="Revisit" items={revisitItems} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
