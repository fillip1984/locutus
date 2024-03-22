import { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { localDb } from "@/db";
import { LibrarySchemaType, librarySchema } from "@/db/schema";
import { Library, getLibraries } from "@/services/libraryApi";

export default function TabOneScreen() {
  const [libraries, setLibraries] = useState<LibrarySchemaType[] | null>();
  useEffect(() => {
    const fetchData = async () => {
      const result = await localDb.select().from(librarySchema);
      setLibraries(result);
    };

    // const fetchData = async () => {
    //   const libs = await getLibraries();
    //   setLibraries(libs);
    // };
    fetchData();
  }, []);
  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen bg-slate-800">
        <Text className="text-white">
          Libraries: {libraries?.length}
          {", Name: "}
          {libraries && libraries[0].name}
        </Text>
        <View />
      </View>
    </SafeAreaView>
  );
}
