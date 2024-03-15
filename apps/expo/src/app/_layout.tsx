import { StatusBar } from "expo-status-bar";

import { TRPCProvider } from "~/utils/api";

import "../styles.css";

import { View } from "react-native";

import AudioPlayer from "./_components/AudioPlayer";
import MinimizedAudioPlayer from "./_components/MinimizedAudioPlayer";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  return (
    <TRPCProvider>
      {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
      <View className="flex h-screen items-center justify-center gap-4 bg-slate-300">
        <AudioPlayer />
        <MinimizedAudioPlayer />
      </View>
      <StatusBar />
    </TRPCProvider>
  );
}
