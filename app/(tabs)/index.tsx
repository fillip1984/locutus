import { FontAwesome } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { localDb } from "@/db";
import {
  LibraryItemSchemaType,
  LibrarySchemaType,
  libraryItemAudioFileSchema,
  libraryItemAudioFileSchemaType,
  libraryItemSchema,
  librarySchema,
} from "@/db/schema";

export default function TabOneScreen() {
  const [libraries, setLibraries] = useState<LibrarySchemaType[] | null>();
  const [libraryItems, setLibraryItems] = useState<
    LibraryItemSchemaType[] | null
  >();
  const [audioFiles, setAudioFiles] = useState<
    libraryItemAudioFileSchemaType[] | null
  >();
  useEffect(() => {
    const fetchData = async () => {
      const result = await localDb.select().from(librarySchema);
      setLibraries(result);
    };

    fetchData();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      const result = await localDb.select().from(libraryItemSchema);
      setLibraryItems(result);
    };

    console.log("refetching items");
    fetchData();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      const result = await localDb.select().from(libraryItemAudioFileSchema);
      setAudioFiles(result);
    };
    fetchData();
  }, []);
  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen bg-slate-800 p-2">
        <Text className="text-white">Libraries: {libraries?.length}</Text>
        <Text className="text-white">
          Library items: {libraryItems?.length}
        </Text>
        <Text className="text-white">AudioFiles: {audioFiles?.length}</Text>
        {/* <FlashList
          data={libraries}
          estimatedItemSize={20}
          renderItem={({ item }) => (
            <View className="rounded bg-slate-400 p-2">
              <Text className="text-white">{item.name}</Text>
            </View>
          )}
        /> */}
        <ScrollView>
          <View className="mt-6 flex flex-row flex-wrap gap-4">
            {libraryItems?.map((item) => (
              <Link
                key={item.id}
                href={`/(media)/${item.id}`}
                className="h-60 w-36 rounded bg-slate-400 p-2">
                <Text className="text-white">{item.title}</Text>
              </Link>
            ))}
          </View>
          <View className="flex items-center justify-center pb-48" />
          <Pressable>
            <FontAwesome name="arrow-circle-up" size={48} color="white" />
          </Pressable>
        </ScrollView>
        {/* <View className="flex flex-row">
          <FlashList
            className=""
            data={libraryItems}
            estimatedItemSize={20}
            renderItem={({ item }) => (
              <View className="h-60 w-32 rounded bg-slate-400 p-2">
                <Text className="text-white">{item.title}</Text>
              </View>
            )}
          />
        </View> */}
        <View />
      </View>
    </SafeAreaView>
  );
}
