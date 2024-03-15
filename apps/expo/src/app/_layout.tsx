import { StatusBar } from "expo-status-bar";

import { TRPCProvider } from "~/utils/api";

import "../styles.css";

import { View } from "react-native";

import AudioPlayer from "./_components/AudioPlayer";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  return (
    <TRPCProvider>
      {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
      <View className="flex h-screen items-center justify-center bg-slate-300 p-2">
        <AudioPlayer />
      </View>
      <StatusBar />
    </TRPCProvider>
  );
}
