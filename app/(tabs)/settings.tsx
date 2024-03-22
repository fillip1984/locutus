import { Pressable, SafeAreaView, Text, View } from "react-native";

export default function Settings() {
  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen bg-slate-800 p-4">
        <Pressable
          onPress={() => console.log("load samples")}
          className="flex w-full items-center justify-center rounded bg-sky-300 px-4 py-2">
          <Text className="text-2xl text-white">Load sample data</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
