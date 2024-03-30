import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import { create } from "zustand";

import { LibraryItemAudioFileSchemaType } from "@/db/schema";

export interface PlayerState {
  audioObject: Sound | null;
  isPlaying: boolean;
  play: (audioFile?: LibraryItemAudioFileSchemaType) => void;
  pause: () => void;
  skipBack: (millis: number) => void;
  skipForward: (millis: number) => void;
  playlist: LibraryItemAudioFileSchemaType[] | null;
  setPlaylist: (playlist: LibraryItemAudioFileSchemaType[]) => void;
  currentTrack: LibraryItemAudioFileSchemaType | null;
  changeTrack: (change: number) => void;
}

export const usePlayerState = create<PlayerState>()((set, get) => ({
  audioObject: null,
  isPlaying: false,
  play: async (audioFile?: LibraryItemAudioFileSchemaType) => {
    // when given an audio file we are expressing our intention to swap the playback track
    if (audioFile && audioFile.id !== get().currentTrack?.id) {
      console.log("unloading previous player");
      await get().audioObject?.unloadAsync();

      console.log("init and play " + audioFile?.name);
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioFile.path as string },
        {
          shouldPlay: true,
        },
      );

      // update state with new playback
      set(() => ({
        audioObject: sound,
        isPlaying: true,
        currentTrack: audioFile,
      }));
    } else {
      // else, we are only intending to resume play of current track
      get().audioObject?.playAsync();
      set(() => ({ isPlaying: true }));
    }
  },
  pause: () => {
    set((state) => {
      state.audioObject?.pauseAsync();
      return { ...state, isPlaying: false };
    });
  },
  skipBack: (millis) => {
    get().audioObject?.setPositionAsync(0 - 30000);
  },
  skipForward: (millis) => {
    get().audioObject?.setPositionAsync(0 + 30000);
  },
  playlist: null,
  setPlaylist: (playlist) => set(() => ({ playlist })),
  currentTrack: null,
  changeTrack: async (change: number) => {
    if (!get().playlist) {
      // console.log("when playlist isn't loaded, nothing to do");
      return;
    }

    // filter playlist to playable media
    const playableMedia = get().playlist?.filter((audioFile) => audioFile.path);
    if (!playableMedia || playableMedia.length === 0) {
      // console.log("when there are no playable tracks, nothig to do");
      return;
    }

    if (!get().currentTrack) {
      // console.log("when currentTrack isn't set, start at the beginning");
      get().play(playableMedia[0]);
    }

    if (!get().currentTrack?.path) {
      // console.log("when currentTrack isn't playable, start at the beginning");
      get().play(playableMedia[0]);
    }

    const index =
      playableMedia.findIndex(
        (audioFile) => audioFile.name === get().currentTrack?.name,
      ) + change;

    if (index < 0) {
      // console.log("if first track go to last");
      const lastTrack = playableMedia[playableMedia.length - 1];
      get().play(lastTrack);
    } else if (index >= playableMedia.length) {
      // console.log("if last track go to beginning");
      get().play(playableMedia[0]);
    } else {
      // console.log(`go to previous or next track ${index + change}`);
      get().play(playableMedia[index]);
    }
  },
}));
