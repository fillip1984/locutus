import { eq } from "drizzle-orm";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";

import { dropDatabase, localDb } from "@/db";
import {
  libraryItemAudioFileSchema,
  libraryItemSchema,
  librarySchema,
  userSettingsSchema,
} from "@/db/schema";
import { getLibraries } from "@/services/libraryApi";
import { getLibraryItem } from "@/services/libraryItemApi";
import { getLibraryItems } from "@/services/libraryItemsApi";
import { login } from "@/services/login";

export default function Settings() {
  const handleSync = async () => {
    Toast.show({
      type: "info",
      text1: "Syncing with server",
    });
    const libraries = await getLibraries();
    for (const library of libraries) {
      // insert or update library
      // TODO: couldn't get this to work
      // await localDb
      //   .insert(librarySchema)
      //   .values({ name: library.name, remoteId: library.id })
      //   .onConflictDoUpdate({
      //     target: librarySchema.id,
      //     set: { name: library.name + new Date(), remoteId: library.id },
      //   });
      let libraryId = null;
      const existingLibrary = await localDb
        .select()
        .from(librarySchema)
        .where(eq(librarySchema.remoteId, library.id));
      if (existingLibrary.length > 0) {
        libraryId = existingLibrary[0].id;
      }
      if (!libraryId) {
        console.log("adding library");
        const result = await localDb
          .insert(librarySchema)
          .values({ name: library.name, remoteId: library.id });
        libraryId = result.lastInsertRowId;
      } else {
        console.log("updating library");
        await localDb
          .update(librarySchema)
          .set({ name: library.name })
          .where(eq(librarySchema.remoteId, library.id));
      }

      const items = await getLibraryItems(library.id);
      // filter down to audiobooks
      const audiobookItems = items.filter(
        (item) => item.media.numAudioFiles > 0,
      );
      for (const item of audiobookItems) {
        const remoteId = item.id;
        let libraryItemId = null;
        const exists = await localDb
          .select()
          .from(libraryItemSchema)
          .where(eq(libraryItemSchema.remoteId, remoteId));
        if (exists.length > 0) {
          libraryItemId = exists[0].id;
        }
        if (!libraryItemId) {
          console.log("adding library item");
          const result = await localDb.insert(libraryItemSchema).values({
            title: item.media.metadata.title,
            authorName: item.media.metadata.authorName,
            duration: item.media.duration,
            numAudioFiles: item.media.numAudioFiles,
            description: item.media.metadata.description,
            publishedYear: item.media.metadata.publishedYear
              ? parseInt(item.media.metadata.publishedYear)
              : null,
            libraryId,
            remoteId: item.id,
          });
          libraryItemId = result.lastInsertRowId;
        } else {
          console.log("updating library item");
          await localDb
            .update(libraryItemSchema)
            .set({
              title: item.media.metadata.title,
              authorName: item.media.metadata.authorName,
              duration: item.media.duration,
              numAudioFiles: item.media.numAudioFiles,
              libraryId,
              remoteId: item.id,
            })
            .where(eq(libraryItemSchema.remoteId, item.id));
        }

        const audioFiles = await getLibraryItem(remoteId);
        for (const audioFile of audioFiles) {
          await localDb.insert(libraryItemAudioFileSchema).values({
            remoteId: audioFile.ino,
            index: audioFile.index,
            duration: audioFile.duration,
            name: audioFile.metadata.filename,
            libraryItemId,
          });
        }
      }
    }
    Toast.show({
      type: "success",
      text1: "Libraries synchronized",
      position: "bottom",
    });
  };

  const handleDropData = () => {
    dropDatabase();
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

    const results = await localDb.update(userSettingsSchema).set({
      serverUrl,
      tokenId,
    });
    console.log({ results });
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
    console.log("logging in");
    const result = await login(serverUrl, username, password);
    console.log({ result });
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
