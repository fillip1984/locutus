import type { Audio } from "expo-av";
import { create } from "zustand";

import {
  LibraryItemAudioFileSchemaType,
  LibraryItemSchemaType,
} from "@/db/schema";

interface PlayerState {
  _playbackDriver: Audio.Sound | null;
  setPlaybackDriver: (playbackDriver: Audio.Sound) => void;
  media: LibraryItemSchemaType | null;
  setMedia: (libraryItem: LibraryItemSchemaType) => void;
  playlist: LibraryItemAudioFileSchemaType[] | null;
  setPlaylist: (playlist: LibraryItemAudioFileSchemaType[]) => void;
  currentTrack: LibraryItemAudioFileSchemaType | null;
  setCurrentTrack: (track: LibraryItemAudioFileSchemaType) => void;
  playing: boolean;
  percentComplete: number;
  play: () => void;
  stop: () => void;
  skipBack: (millis: number) => void;
  skipForward: (millis: number) => void;
  previousTrack: () => void;
  nextTrack: () => void;
}

export const usePlayerState = create<PlayerState>()((set) => ({
  _playbackDriver: null,
  setPlaybackDriver: (playbackDriver) =>
    set(() => ({ _playbackDriver: playbackDriver })),
  media: null,
  setMedia: (libraryItem) => set(() => ({ media: libraryItem })),
  playlist: null,
  setPlaylist: (playlist) => set(() => ({ playlist })),
  currentTrack: null,
  setCurrentTrack: (track: LibraryItemAudioFileSchemaType) =>
    set(() => ({ currentTrack: track, playing: true })),
  playing: false,
  percentComplete: 0,
  play: () => set(() => ({ playing: true })),
  stop: () => set(() => ({ playing: false })),
  skipBack: (millis: number) => {
    console.log("skipping", millis);
  },
  skipForward: (millis: number) => {
    console.log("skipping", millis);
  },
  previousTrack: () => {
    console.log("previous");
  },
  nextTrack: () => {
    console.log("next");
  },
}));
