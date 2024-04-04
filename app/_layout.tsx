import { Stack } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import TrackPlayer, { Capability } from "react-native-track-player";

import "../global.css";

import { playbackService } from "../services/playbackService";

import MiniPlayer from "@/components/MiniPlayer";

import { View } from "react-native";

export default function RootLayout() {
  const setupPlayer = async () => {
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
      progressUpdateEventInterval: 500,
    });
  };
  useEffect(() => {
    setupPlayer();
    TrackPlayer.registerPlaybackService(() => playbackService);
  }, []);

  return (
    <>
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
      <Toast />

      {/* <MiniPlayer /> */}
    </>
  );
}
