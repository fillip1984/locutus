import { router } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { useEffect, useMemo } from "react";
import {
  useOnChangeTrack,
  useOnPlaybackProgressChange,
  useOnPlaybackStateChange,
  usePlaylist,
} from "react-native-nitro-player";

import MiniPlayer from "@/components/mini-player";
import { useSessionStore } from "@/stores/session-store";
import { TrackPlayerExtraPayload } from "../_layout";

export default function TabLayout() {
  const { isAuthenticated } = useSessionStore();
  const { state: playbackState } = useOnPlaybackStateChange();
  const { track: currentTrack } = useOnChangeTrack();
  const { position: playbackPosition } = useOnPlaybackProgressChange();

  const effectiveTitle = useMemo(() => {
    if (!currentTrack?.extraPayload) {
      return currentTrack?.title ?? "Loading...";
    }

    const chapters = (currentTrack.extraPayload as TrackPlayerExtraPayload)
      .chapters;
    if (!chapters) {
      return currentTrack.title ?? "Unknown Title";
    }

    const currentChapter = chapters.find(
      (chapter) =>
        chapter.start <= playbackPosition && chapter.end > playbackPosition,
    );
    return currentChapter?.title ?? currentTrack.title ?? "Unknown Title";
  }, [currentTrack, playbackPosition]);

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
              effectiveTitle={effectiveTitle}
              playbackState={playbackState}
            />
          </NativeTabs.BottomAccessory>
        )}
      </NativeTabs>
    </>
  );
}
