import { Pressable, SafeAreaView, Text, View } from "react-native";

import { loadSampleData } from "~/store/mediaStore";

export default function Settings() {
  return (
    <SafeAreaView>
      <View className="flex h-screen bg-slate-800 p-4">
        <Pressable
          onPress={() => loadSampleData()}
          className="rounded bg-sky-300 px-4 py-2">
          <Text className="text-white">Load sample data</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
