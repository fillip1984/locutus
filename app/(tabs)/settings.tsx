import { Pressable, SafeAreaView, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { dropDatabase } from "@/db";
import { useLibraryStore } from "@/stores/libraryStore";

export default function Settings() {
  const libraryStore = useLibraryStore();
  const handleSync = async () => {
    Toast.show({
      type: "info",
      text1: "Syncing with server",
      position: "bottom",
    });
    await libraryStore.syncWithServer();
    Toast.show({
      type: "success",
      text1: "Libraries synchronized",
      position: "bottom",
    });
  };

  const handleDropData = () => {
    dropDatabase();
    libraryStore.refetch();
  };

  const handleLogin = async () => {
    // const result = await login(serverUrl, username, password);
    // setTokenId(result.user.token);
  };

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen gap-4 bg-slate-800 p-4">
        <Text className="text-3xl text-white">AudioBookShelf Settings</Text>

        <View className="flex gap-2">
          <Text className="text-3xl text-white">Data</Text>
          <Pressable
            onPress={handleSync}
            className="flex w-full items-center justify-center rounded bg-sky-300 px-4 py-2">
            <Text className="text-2xl text-white">Sync</Text>
          </Pressable>

          <Pressable
            onPress={handleDropData}
            className="flex w-full items-center justify-center rounded bg-red-300 px-4 py-2">
            <Text className="text-2xl text-white">Drop data</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
