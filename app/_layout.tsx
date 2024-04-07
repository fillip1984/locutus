import { Stack } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import TrackPlayer, { Capability } from "react-native-track-player";

import "../global.css";

import { playbackService } from "../services/playbackService";

export default function RootLayout() {
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
    </>
  );
}
