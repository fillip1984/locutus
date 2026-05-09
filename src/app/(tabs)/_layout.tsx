import { useEffect } from "react";
import {
  useOnChangeTrack,
  useOnPlaybackStateChange,
  usePlaylist,
} from "react-native-nitro-player";
import { router } from "expo-router";
import { NativeTabs } from "expo-router/build/native-tabs";

import MiniPlayer from "@/components/mini-player";
import { useSessionStore } from "@/stores/session-store";

export default function TabLayout() {
  const { isAuthenticated } = useSessionStore();
  const { state: playbackState } = useOnPlaybackStateChange();
  const { track: currentTrack } = useOnChangeTrack();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated]);

  const { currentPlaylist } = usePlaylist();

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
        {currentPlaylist && currentPlaylist.tracks.length > 0 && (
          <NativeTabs.BottomAccessory>
            <MiniPlayer
              currentTrack={currentTrack}
              playbackState={playbackState}
            />
          </NativeTabs.BottomAccessory>
        )}
      </NativeTabs>
    </>
  );
}
