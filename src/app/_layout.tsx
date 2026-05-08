import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import { Stack, useFocusEffect } from "expo-router";

import { toast, Toaster } from "sonner-native";

import "../global.css";

import {
  PlayerQueue,
  TrackPlayer,
  useNowPlaying,
} from "react-native-nitro-player";

import {
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFileExplorerDevTools } from "file-explorer-expo-dev-plugin";

import { colors } from "@/components/ui/colors";
import { db } from "@/db";
import {
  markComplete,
  recordProgress,
  syncProgressWithServer,
} from "@/services/progressService";
import { useSessionStore } from "@/stores/session-store";

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
  const { isAuthenticated } = useSessionStore();

  if (isAuthenticated) {
    return <MainLayout />;
  }

  return <Login />;
}

const MainLayout = () => {
  useEffect(() => {
    const setupPlayer = async () => {
      // TODO: rebuild last played playlist from server instead of just clearing it out?
      if (PlayerQueue.getCurrentPlaylistId() !== null) {
        TrackPlayer.pause();
        await PlayerQueue.deletePlaylist(
          PlayerQueue.getCurrentPlaylistId() as string,
        );
      }

      await TrackPlayer.configure({
        showInNotification: true,
        carPlayEnabled: true,
      });
    };
    setupPlayer();
  }, []);

  // setup progres and complete hooks
  const { currentTrack, currentPosition, currentState } = useNowPlaying();
  useEffect(() => {
    if (
      currentTrack &&
      (currentTrack.extraPayload as TrackPlayerExtraPayload).previousTrack !==
        null &&
      Math.round(currentPosition) === 0
    ) {
      // TODO: couldn't get either useOnPlaybackStateChange.reason nor useOnChangeTrack.reason to tell me when the file ended
      const previousTrack = (
        currentTrack.extraPayload as TrackPlayerExtraPayload
      ).previousTrack!;
      // console.log("on playing a new track, mark previous track as complete");
      markComplete({
        track: previousTrack.audioFileId,
        duration: previousTrack.duration,
      });
    } else if (
      currentTrack &&
      Math.round(currentPosition) > 0 &&
      Math.round(currentPosition) % 15 === 0
    ) {
      // console.log(
      //   "every 15 seconds, record progress, current position:",
      //   currentPosition,
      //   currentTrack.title,
      // );
      recordProgress(currentTrack, currentPosition);
    }
  }, [currentTrack, currentPosition]);
  useEffect(() => {
    // console.log("on change of state (play or pause), record progress");
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
        <Stack.Screen name="player/[id]" options={{}} />
        <Stack.Screen name="reader/[id]" options={{}} />
      </Stack>
      <Toaster />
    </GestureHandlerRootView>
  );
};

const Login = () => {
  const [serverUrl, setServerUrl] = useState(
    process.env.EXPO_PUBLIC_AUDIOBOOK_SHELF_API_URL ?? "",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [canLogInWithBiometrics, setCanLogInWithBiometrics] = useState(false);

  const requestAndAuthenticateViaBiometrics = async () => {
    const authenticated = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate with Face ID",
    });

    if (authenticated.success) {
      return true;
    } else {
      console.warn(authenticated.error);
      return false;
    }
  };

  const { logIn, logInWithBiometrics } = useSessionStore();

  const handleLogin = async () => {
    try {
      if (!serverUrl || !username || !password) {
        toast.warning("Please fill in all fields");
        return;
      }

      setLoading(true);
      const success = await logIn(serverUrl, username, password);
      if (!success) {
        toast.error("Invalid username or password");
      }
      // const bioAuthResult = await requestAndAuthenticateViaBiometrics();
      // if (bioAuthResult) {
      //   await logInWithBiometrics(bioAuthResult);
      // }
    } catch {
      toast.error("Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithBiometrics = async () => {
    try {
      if (!serverUrl) {
        toast.warning("Please set server url first");
        return;
      }

      const bioAuthResult = await requestAndAuthenticateViaBiometrics();
      if (bioAuthResult) {
        await logInWithBiometrics(bioAuthResult);
      }
    } catch {
      toast.error("Unknown error");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const result = await db.query.userSettingsSchema.findFirst();
        if (result && result.signInWithBiometrics) {
          setCanLogInWithBiometrics(true);
          const bioAuthResult = await requestAndAuthenticateViaBiometrics();
          if (bioAuthResult) {
            logInWithBiometrics(bioAuthResult);
            await syncProgressWithServer();
          }
        }
      };

      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex h-screen items-center gap-4 p-4">
          <Text className="text-3xl text-white">locutus</Text>

          <View className="flex w-full gap-3">
            <View className="flex w-full flex-row items-center gap-2">
              <MaterialCommunityIcons name="server" size={32} color="white" />
              <TextInput
                value={serverUrl}
                onChangeText={(text) => setServerUrl(text)}
                placeholder="Server Url, i.e. http://192.168.0.10:13378"
                className="flex-1 rounded bg-white p-2 text-xl text-black"
                autoCapitalize="none"
                onBlur={() => {
                  async function testConnection() {
                    try {
                      const response = await fetch(serverUrl + "/ping");
                      if (!response.ok) {
                        throw new Error("Server responded with an error");
                      }
                      toast.success("Successfully connected to server");
                    } catch (error) {
                      console.error("Error connecting to server:", error);
                      toast.error(
                        "Unable to connect to server, please check the url and your network connection",
                      );
                    }
                  }
                  testConnection();
                }}
              />
            </View>

            <View className="my-4 flex gap-3">
              <View className="flex w-full flex-row items-center gap-2">
                <Ionicons name="person-sharp" size={32} color="white" />
                <TextInput
                  value={username}
                  onChangeText={(text) => setUsername(text)}
                  placeholder="Username"
                  className="flex-1 rounded bg-white p-2 text-xl text-black"
                  autoCapitalize="none"
                />
              </View>

              <View className="flex w-full flex-row items-center gap-2">
                <MaterialIcons name="password" size={32} color="white" />
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
                    <FontAwesome6 name="circle-notch" size={32} color="white" />
                  </View>
                )}
                <Text className="text-3xl text-white">Login</Text>
              </Pressable>

              <Pressable
                onPress={handleLoginWithBiometrics}
                className={`rounded bg-sky-300 p-3 ${!canLogInWithBiometrics ? "opacity-50" : ""}`}
                disabled={!canLogInWithBiometrics}
              >
                <MaterialCommunityIcons
                  name="face-recognition"
                  size={42}
                  color="white"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
      <Toaster />
    </GestureHandlerRootView>
  );
};
