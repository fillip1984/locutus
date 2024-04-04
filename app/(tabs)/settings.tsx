import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";

import { dropDatabase, localDb } from "@/db";
import { userSettingsSchema } from "@/db/schema";
import { login } from "@/services/login";
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

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const result = await localDb.select().from(userSettingsSchema);
        if (result.length === 0) {
          //stub out record so it can be updated
          await localDb
            .insert(userSettingsSchema)
            .values({ serverUrl: "", tokenId: "" });
        } else if (result.length > 0) {
          setServerUrl(result[0].serverUrl);
          setTokenId(result[0].tokenId);
        }
      };

      fetchData();
    }, []),
  );

  const handleSaveUserSettings = async () => {
    Toast.show({
      type: "info",
      text1: "Saving settings",
      position: "bottom",
    });

    await localDb.update(userSettingsSchema).set({
      serverUrl,
      tokenId,
    });
    Toast.show({
      type: "success",
      text1: "Saved settings",
      position: "bottom",
    });
  };

  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tokenId, setTokenId] = useState("");
  const handleLogin = async () => {
    const result = await login(serverUrl, username, password);
    setTokenId(result.user.token);
  };

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen gap-4 bg-slate-800 p-4">
        <Text className="text-3xl text-white">AudioBookShelf Settings</Text>

        <View className="flex gap-2">
          <Text className="text-white">Server Url</Text>
          <TextInput
            value={serverUrl}
            onChangeText={(text) => setServerUrl(text)}
            className="rounded bg-white p-2 text-xl text-black"
            placeholder="http://192.168.0.10:13378"
          />
          <Text className="text-white">Username</Text>
          <TextInput
            value={username}
            onChangeText={(text) => setUsername(text)}
            className="rounded bg-white p-2 text-xl text-black"
          />
          <Text className="text-white">Password</Text>
          <TextInput
            value={password}
            onChangeText={(text) => setPassword(text)}
            secureTextEntry
            className="rounded bg-white p-2 text-xl text-black"
          />

          <Pressable
            onPress={handleLogin}
            className="flex items-center rounded bg-sky-300 px-4 py-2">
            <Text className="text-3xl text-white">Login</Text>
          </Pressable>

          <View>
            <Text className="text-white">User token</Text>
            <Text className="rounded p-2 text-slate-400">{tokenId}</Text>
            <Pressable
              onPress={handleSaveUserSettings}
              className="flex items-center rounded bg-sky-300 px-4 py-2">
              <Text className="text-3xl text-white">Save</Text>
            </Pressable>
          </View>
        </View>

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
