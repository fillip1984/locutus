import { Stack } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import TrackPlayer, { Capability, Event } from "react-native-track-player";

import "../global.css";

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
    });
  };
  useEffect(() => {
    setupPlayer();
    TrackPlayer.registerPlaybackService(() => playbackService);
  }, []);

  const playbackService = async () => {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteNext, () =>
      TrackPlayer.skipToNext(),
    );
    TrackPlayer.addEventListener(Event.RemotePrevious, () =>
      TrackPlayer.skipToPrevious(),
    );
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
