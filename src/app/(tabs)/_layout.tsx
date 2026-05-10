import { useEffect, useState } from "react";
import {
  useOnChangeTrack,
  useOnPlaybackProgressChange,
  useOnPlaybackStateChange,
  usePlaylist,
} from "react-native-nitro-player";
import { router } from "expo-router";
import { NativeTabs } from "expo-router/build/native-tabs";

import MiniPlayer from "@/components/mini-player";
import { useSessionStore } from "@/stores/session-store";
import { TrackPlayerExtraPayload } from "../_layout";

export default function TabLayout() {
  const { isAuthenticated } = useSessionStore();
  const { state: playbackState } = useOnPlaybackStateChange();
  const { track: currentTrack } = useOnChangeTrack();
  const { position: playbackPosition } = useOnPlaybackProgressChange();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated]);

  const { currentPlaylist } = usePlaylist();

  // TODO: couldn't figure out how to update the title so having to resolve it myself
  const [effectiveTitle, setEffectiveTitle] = useState("Loading...");
  useEffect(() => {
    if (!currentTrack?.extraPayload) {
      return;
    }
    const chapters = (currentTrack?.extraPayload as TrackPlayerExtraPayload)
      .chapters;
    if (!chapters) {
      setEffectiveTitle(currentTrack?.title ?? "Unknown Title");
      return;
    }
    const currentChapterIndex = chapters.findIndex(
      (chapter) =>
        chapter.start <= playbackPosition && chapter.end > playbackPosition,
    );
    if (currentChapterIndex === -1) {
      console.error("Current chapter not found");
      return;
    }
    setEffectiveTitle(chapters[currentChapterIndex].title);
  }, [currentTrack?.title, playbackPosition]);

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
