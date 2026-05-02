import { useState } from "react";
import { NativeTabs } from "expo-router/build/native-tabs";

import MiniPlayer from "@/components/mini-player";

export default function TabLayout() {
  // State must be stored outside BottomAccessory
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <NativeTabs minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Recent</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="play.house.fill" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="library">
          <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="books.vertical.fill" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="gearshape.fill" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="search" role="search">
          <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.BottomAccessory>
          <MiniPlayer
            isPlaying={isPlaying}
            onToggle={() => setIsPlaying(!isPlaying)}
          />
        </NativeTabs.BottomAccessory>
      </NativeTabs>
    </>
  );
}
