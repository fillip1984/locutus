import { Stack } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import TrackPlayer, { Capability, Event } from "react-native-track-player";

import { skipInterval, usePlayerState } from "@/stores/playerStore";
import "../global.css";

export default function RootLayout() {
  const playerState = usePlayerState();
  const setupPlayer = async () => {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToPrevious,
        Capability.SkipToNext,
      ],
      forwardJumpInterval: skipInterval,
      backwardJumpInterval: skipInterval,
      progressUpdateEventInterval: 1,
    });
  };
  useEffect(() => {
    setupPlayer();
    TrackPlayer.registerPlaybackService(() => playbackService);
  }, []);

  const playbackService = async () => {
    TrackPlayer.addEventListener(Event.RemotePlay, () => playerState.play({}));

    TrackPlayer.addEventListener(Event.RemotePause, () => playerState.pause());
  };

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
