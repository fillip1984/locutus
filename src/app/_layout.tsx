import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { toast, Toaster } from "sonner-native";

import { db } from "@/db";
import { userSettingsSchema } from "@/db/schema";
import { login } from "@/services/loginApi";
import { getToken } from "@/stores/session-store";

import "../global.css";

import { TrackPlayer, useNowPlaying } from "react-native-nitro-player";

import { useFileExplorerDevTools } from "file-explorer-expo-dev-plugin";

import {
  isAudioFileNearEnd,
  markComplete,
  recordProgress,
} from "@/services/progressService";

export type TrackPlayerExtraPayload = {
  libraryItemId: string;
  audioFileId: string;
  previousTrack: {
    audioFileId: string;
    duration: number;
  } | null;
};

export default function RootLayout() {
  useFileExplorerDevTools();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      const settings = await db.select().from(userSettingsSchema).limit(1);
      const token = await getToken();
      if (token && settings.length > 0) {
        // console.log({ token });
        setIsLoggedIn(true);
      }
    };
    checkAuth();
  }, []);

  if (isLoggedIn) {
    return <MainLayout />;
  }

  return <Login setIsLoggedIn={setIsLoggedIn} />;
}

const MainLayout = () => {
  useEffect(() => {
    const setupPlayer = async () => {
      await TrackPlayer.configure({
        showInNotification: true,
        carPlayEnabled: true,
      });
    };
    setupPlayer();
  }, []);

  const { currentTrack, currentPosition, currentState } = useNowPlaying();

  useEffect(() => {
    if (
      currentTrack &&
      (currentTrack.extraPayload as TrackPlayerExtraPayload).previousTrack !==
        null &&
      Math.round(currentPosition) === 0 &&
      isAudioFileNearEnd(currentPosition, currentTrack.duration)
    ) {
      // TODO: couldn't get either useOnPlaybackStateChange.reason nor useOnChangeTrack.reason to tell me when the file ended
      const previousTrack = (
        currentTrack.extraPayload as TrackPlayerExtraPayload
      ).previousTrack!;
      console.log("on playing a new track, mark previous track as complete");
      markComplete({
        track: previousTrack.audioFileId,
        duration: previousTrack.duration,
      });
    } else if (currentTrack && Math.round(currentPosition) % 15 === 0) {
      console.log("every 15 seconds, record progress");
      recordProgress(currentTrack, currentPosition);
    }
  }, [currentTrack, currentPosition]);
  useEffect(() => {
    // on change of state (play or pause), record progress
    if (currentTrack) {
      recordProgress(currentTrack, currentPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState]);

  return (
    <GestureHandlerRootView>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="media/[id]"
          options={{
            headerTransparent: true,
            title: "",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen
          name="player/[id]"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="reader/[id]"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
          }}
        />
      </Stack>
      <Toaster />
    </GestureHandlerRootView>
  );
};

const Login = ({
  setIsLoggedIn,
}: {
  setIsLoggedIn: (loggedIn: boolean) => void;
}) => {
  // const { success, error } = useMigrations(db, migrations);

  const [serverUrl, setServerUrl] = useState(
    process.env.EXPO_PUBLIC_AUDIOBOOK_SHELF_API_URL,
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const token = await login(serverUrl, username, password);
    console.log({ token });
    setLoading(false);
    if (token) {
      setIsLoggedIn(true);
      await db.insert(userSettingsSchema).values({
        serverUrl,
        signInWithBiometrics: false,
      });
    } else {
      toast.error("Login failed, please check your credentials and try again");
    }
  };

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
        <View className="flex h-screen items-center gap-4 bg-slate-800 p-4">
          <Text className="text-3xl text-white">locutus</Text>

          <View className="flex w-full gap-3">
            <View className="flex w-full flex-row items-center gap-2">
              {/* <MaterialCommunityIcons name="server" size={32} color="white" /> */}
              <TextInput
                value={serverUrl}
                onChangeText={(text) => setServerUrl(text)}
                placeholder="Server Url, i.e. http://192.168.0.10:13378"
                className="flex-1 rounded bg-white p-2 text-xl text-black"
                autoCapitalize="none"
              />
            </View>

            <View className="my-4 flex gap-3">
              <View className="flex w-full flex-row items-center gap-2">
                {/* <Ionicons name="person-sharp" size={32} color="white" /> */}
                <TextInput
                  value={username}
                  onChangeText={(text) => setUsername(text)}
                  placeholder="Username"
                  className="flex-1 rounded bg-white p-2 text-xl text-black"
                  autoCapitalize="none"
                />
              </View>

              <View className="flex w-full flex-row items-center gap-2">
                {/* <MaterialIcons name="password" size={32} color="white" /> */}
                <TextInput
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                  placeholder="Password"
                  secureTextEntry
                  className="flex-1 rounded bg-white p-2 text-xl text-black"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="flex flex-row items-center gap-4">
              <Pressable
                onPress={handleLogin}
                className="flex flex-1 flex-row items-center justify-center gap-3 rounded bg-sky-300 px-4 py-2"
              >
                {loading && (
                  <View className="animate-spin">
                    {/* <FontAwesome6 name="circle-notch" size={32} color="white" /> */}
                  </View>
                )}
                <Text className="text-3xl text-white">Login</Text>
              </Pressable>

              <Pressable className="rounded bg-sky-300 p-3">
                {/* <MaterialCommunityIcons
                name="face-recognition"
                size={42}
                color="white"
              /> */}
              </Pressable>
            </View>
            {/* <View>
            <Text className="text-white">User token</Text>
            <Text className="rounded p-2 text-slate-400">{tokenId}</Text> */}
            {/* <Pressable
              onPress={handleSaveUserSettings}
              className="flex items-center rounded bg-sky-300 px-4 py-2">
              <Text className="text-3xl text-white">Save</Text>
            </Pressable> */}
            {/* </View> */}
          </View>

          {/* <View className="flex gap-2">
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
        </View> */}
        </View>
      </SafeAreaView>
      <Toaster />
    </GestureHandlerRootView>
  );
};
