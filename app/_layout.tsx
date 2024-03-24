import { Stack } from "expo-router";

import "../global.css";

export default function RootLayout() {
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
}
