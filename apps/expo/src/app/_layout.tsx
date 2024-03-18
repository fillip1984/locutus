import { StatusBar } from "expo-status-bar";

import { TRPCProvider } from "~/utils/api";

import "../styles.css";

import { Stack } from "expo-router";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  return (
    <TRPCProvider>
      {/* TODO: is there a way to style safe area using tailwind/nativewind?  */}
      {/* TODO: style safe area to match background, right now I'm doing this <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>  */}
      <Stack
        screenOptions={{
          headerShown: false,
        }}></Stack>
      <StatusBar />
    </TRPCProvider>
  );
}
