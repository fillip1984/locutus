import { ReaderProvider } from "@epubjs-react-native/core";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AxiosError } from "axios";
import * as LocalAuthentication from "expo-local-authentication";
import { Stack, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import TrackPlayer, { Capability } from "react-native-track-player";

import "../global.css";
import { playbackService } from "../services/playbackService";

import { localDb } from "@/db";
import { userSettingsSchema } from "@/db/schema";
import { login } from "@/services/loginApi";
import { syncProgressWithServer } from "@/services/progressService";
import { setToken } from "@/stores/sessionStore";

export default function RootLayout() {
  const [authenticated, setAuthenticated] = useState(false);
  const [preferences, setPreferences] = useState();

  const initializePlayer = async () => {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToPrevious,
        Capability.SkipToNext,
        Capability.JumpBackward,
        Capability.JumpForward,
      ],
      forwardJumpInterval: 30,
      backwardJumpInterval: 30,
      progressUpdateEventInterval: 15,
    });
    TrackPlayer.registerPlaybackService(() => playbackService);
  };

  useEffect(() => {
    initializePlayer();
  }, []);

  if (authenticated) {
    return (
      <>
        <ReaderProvider>
          <MainLayout />
        </ReaderProvider>
        <StatusBar style="light" />
        <Toast />
      </>
    );
  } else {
    return (
      <>
        <Login setAuthenticated={setAuthenticated} />
        <StatusBar style="light" />
        <Toast />
      </>
    );
  }
}

const MainLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(media)/modal"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
};

const Login = ({
  setAuthenticated,
}: {
  setAuthenticated: Dispatch<SetStateAction<boolean>>;
}) => {
  useFocusEffect(
    useCallback(() => {
      console.log("fetchin");
      const fetchData = async () => {
        const result = await localDb.select().from(userSettingsSchema);
        // TODO: this is a mess, but working for now
        if (result.length > 0) {
          setServerUrl(result[0].serverUrl);
          setPreferBiometric(result[0].signInWithBiometrics);

          if (result[0].signInWithBiometrics) {
            const bioAuthResult = await requestAndAuthenticateViaBiometrics();
            if (bioAuthResult) {
              setAuthenticated(true);
              await syncProgressWithServer();
            }
          }
        }
      };

      fetchData();
    }, []),
  );

  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [preferBiometric, setPreferBiometric] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await login(serverUrl, username, password);
      setToken(result.user.token);
      // TODO: assuming biometrics are desired
      const updates = await localDb.insert(userSettingsSchema).values({
        serverUrl,
        signInWithBiometrics: true,
      });
      const bioAuthResult = await requestAndAuthenticateViaBiometrics();
      if (bioAuthResult) {
        setAuthenticated(true);
      } else {
        // TODO: this flow is still not right
        setAuthenticated(true);
      }
    } catch (e) {
      console.error({ msg: "Failed to log in", e });
      if (e instanceof AxiosError) {
        if (e.response?.status === 401) {
          Toast.show({
            type: "error",
            text1: "Please try again",
            text2: "Invalid username and or password",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Unable to connect to server",
          });
        }
      } else {
        Toast.show({ type: "error", text1: "Unknown error" });
      }
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen items-center gap-4 bg-slate-800 p-4">
        <Text className="text-3xl text-white">locutus</Text>

        <View className="flex w-full gap-3">
          <View className="flex w-full flex-row items-center gap-2">
            <MaterialCommunityIcons name="server" size={32} color="white" />
            <TextInput
              value={serverUrl}
              onChangeText={(text) => setServerUrl(text)}
              placeholder="Server Url, i.e. http://192.168.0.10:13378"
              className="flex-1 rounded bg-white p-2 text-xl text-black"
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
              />
            </View>
          </View>

          <View className="flex flex-row items-center gap-4">
            <Pressable
              onPress={handleLogin}
              className="flex flex-1 flex-row items-center justify-center gap-3 rounded bg-sky-300 px-4 py-2">
              {loading && (
                <View className="animate-spin">
                  <FontAwesome6 name="circle-notch" size={32} color="white" />
                </View>
              )}
              <Text className="text-3xl text-white">Login</Text>
            </Pressable>

            <Pressable className="rounded bg-sky-300 p-3">
              <MaterialCommunityIcons
                name="face-recognition"
                size={42}
                color="white"
              />
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
  );
};
