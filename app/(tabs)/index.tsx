import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, View, ScrollView } from "react-native";

import BookLink from "@/components/BookLink";
import { LibraryItemSchemaType } from "@/db/schema";
import { useLibraryStore } from "@/stores/libraryStore";

export default function Home() {
  const libraryStore = useLibraryStore();
  useEffect(() => {
    libraryStore.refetch("LastTouched");
  }, []);

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

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      {libraryStore && libraryStore.libraryItems && (
        <View className="flex h-screen bg-slate-800 p-2">
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
    </SafeAreaView>
  );
}

const ContinueSection = ({ items }: { items: LibraryItemSchemaType[] }) => {
  return (
    <>
      <Text className="text-4xl text-white">Continue</Text>
      <ScrollView>
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
      <ScrollView>
        <View className="flex flex-row gap-3">
          {items.map((item) => (
            <BookLink key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </>
  );
};
