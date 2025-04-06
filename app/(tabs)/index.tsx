import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { useActiveTrack } from "react-native-track-player";

import BookLink from "@/app/_components/BookLink";
import MiniPlayer from "@/app/_components/MiniPlayer";
import { localDb } from "@/db";
import { LibraryItemSchemaType, userSettingsSchema } from "@/db/schema";
import { getProgressFromServer } from "@/services/progressService";
import { useDownloadStore } from "@/stores/downloadStore";
import { useLibraryStore } from "@/stores/libraryStore";

export default function Home() {
  const libraryStore = useLibraryStore();
  const downloadStore = useDownloadStore();
  const track = useActiveTrack();

  useFocusEffect(
    useCallback(() => {
      libraryStore.refetch({ sort: "Recent" });
    }, []),
  );

  useEffect(() => {
    async function initView() {
      if (
        libraryStore.status === "loaded" &&
        (libraryStore.libraries === undefined ||
          libraryStore.libraries?.length === 0)
      ) {
        const result = await localDb.select().from(userSettingsSchema);
        console.log("syncing libraries");
        await libraryStore.syncWithServer();
        const serverProgressUpdates = await getProgressFromServer(
          result[0].serverUrl,
          0,
        );
        for (const media of serverProgressUpdates) {
          downloadStore.add(media.libraryItemId);
        }
        downloadStore.download();
      }

      setContinueItems(
        libraryStore.libraryItems?.filter(
          (i) => !i.complete && (i.lastPlayedId || i.lastEBookId),
        ),
      );
      setDownloadedItems(
        libraryStore.libraryItems?.filter((i) => i.downloaded),
      );
      setRevisitItems(libraryStore.libraryItems?.filter((i) => i.complete));
    }

    if (libraryStore.status === "loaded") {
      initView();
    }
  }, [libraryStore.status]);

  // continue is a reserved word
  const [continueItems, setContinueItems] = useState<LibraryItemSchemaType[]>();
  const [downloadedItems, setDownloadedItems] =
    useState<LibraryItemSchemaType[]>();
  const [revisitItems, setRevisitItems] = useState<LibraryItemSchemaType[]>();

  const bottomTabbarHeight = useBottomTabBarHeight();

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="relative">
        {libraryStore && libraryStore.libraryItems && (
          <View className="flex h-screen bg-zinc-900 p-2">
            {libraryStore.libraryItems?.length === 0 && (
              <View className="flex h-screen items-center justify-center">
                <Text className="text-2xl text-white">Nothing to play</Text>
              </View>
            )}

            <ScrollView>
              <View className="flex gap-4">
                {continueItems && continueItems.length > 0 && (
                  <Section label="Continue" items={continueItems} />
                )}

                {downloadedItems && downloadedItems.length > 0 && (
                  <Section label="Downloaded" items={downloadedItems} />
                )}

                {revisitItems && revisitItems.length > 0 && (
                  <Section label="Revisit" items={revisitItems} />
                )}
              </View>
            </ScrollView>
          </View>
        )}
        {/* TODO: not sure why, but I have to declare bg color here for it to take effect */}
        {/* TODO: Couldn't find a better way to afix to the bottom, try flex methods maybe? */}
        {track && (
          <View
            className="absolute left-0 right-0 bg-zinc-800"
            style={{ bottom: bottomTabbarHeight + 59 }}>
            <MiniPlayer />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const Section = ({
  label,
  items,
}: {
  label: string;
  items: LibraryItemSchemaType[];
}) => {
  return (
    <>
      <Text className="text-4xl font-bold text-white">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex flex-row gap-3">
          {items.map((item) => (
            <BookLink key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </>
  );
};
