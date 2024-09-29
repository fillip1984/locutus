import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { useActiveTrack } from "react-native-track-player";

import BookLink from "@/app/_components/BookLink";
import MiniPlayer from "@/app/_components/MiniPlayer";
import { LibraryItemSchemaType } from "@/db/schema";
import { useLibraryStore } from "@/stores/libraryStore";

export default function Home() {
  const libraryStore = useLibraryStore();
  useEffect(() => {
    libraryStore.refetch("LastTouched");
  }, []);
  const track = useActiveTrack();

  useEffect(() => {
    setContinueItems(libraryStore.libraryItems?.filter((i) => i.lastPlayedId));
    setDownloadedItems(libraryStore.libraryItems?.filter((i) => i.downloaded));
    setRelistenItems(libraryStore.libraryItems?.filter((i) => i.complete));
  }, [libraryStore]);

  // continue is a reserved word
  const [continueItems, setContinueItems] = useState<LibraryItemSchemaType[]>();
  const [downloadedItems, setDownloadedItems] =
    useState<LibraryItemSchemaType[]>();
  const [relistenItems, setRelistenItems] = useState<LibraryItemSchemaType[]>();

  const bottomTabbarHeight = useBottomTabBarHeight();

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="relative">
        {libraryStore && libraryStore.libraryItems && (
          <View className="flex h-screen bg-slate-800 p-2">
            {libraryStore.libraryItems?.length === 0 && (
              <View className="flex h-screen items-center justify-center">
                <Text className="text-2xl text-white">Nothing to play</Text>
              </View>
            )}

            <ScrollView>
              <View className="flex gap-4">
                {continueItems && continueItems.length > 0 && (
                  <ContinueSection items={continueItems} />
                )}

                {downloadedItems && downloadedItems.length > 0 && (
                  <DownloadedSection items={downloadedItems} />
                )}

                {relistenItems && relistenItems.length > 0 && (
                  <RelistenSection items={relistenItems} />
                )}
              </View>
            </ScrollView>
          </View>
        )}
        {/* TODO: not sure why, but I have to declare bg color here for it to take effect */}
        {/* TODO: Couldn't find a better way to afix to the bottom, try flex methods maybe? */}
        {track && (
          <View
            className="absolute left-0 right-0 bg-slate-900"
            style={{ bottom: bottomTabbarHeight + 59 }}>
            <MiniPlayer />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const ContinueSection = ({ items }: { items: LibraryItemSchemaType[] }) => {
  return (
    <>
      <Text className="text-4xl text-white">Continue</Text>
      <ScrollView horizontal>
        <View className="flex flex-row gap-3">
          {items.map((item) => (
            <BookLink key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </>
  );
};

const DownloadedSection = ({ items }: { items: LibraryItemSchemaType[] }) => {
  return (
    <>
      <Text className="text-4xl text-white">Downloaded</Text>
      <ScrollView horizontal>
        <View className="flex flex-row gap-3">
          {items.map((item) => (
            <BookLink key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </>
  );
};

const RelistenSection = ({ items }: { items: LibraryItemSchemaType[] }) => {
  return (
    <>
      <Text className="text-4xl text-white">Relisten</Text>
      <ScrollView horizontal>
        <View className="flex flex-row gap-3">
          {items.map((item) => (
            <BookLink key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </>
  );
};
