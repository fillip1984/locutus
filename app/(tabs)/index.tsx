import { useEffect } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { useLibraryStore } from "@/stores/libraryStore";

export default function TabOneScreen() {
  const libraryStore = useLibraryStore();

  useEffect(() => {
    libraryStore.execute();
  }, []);
  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen bg-slate-800">
        <Text className="text-white">
          Libraries: {libraryStore.libraries?.length}
          {", Name: "}
          {libraryStore.libraries && libraryStore.libraries[0].name}
        </Text>
        <View />
      </View>
    </SafeAreaView>
  );
}
