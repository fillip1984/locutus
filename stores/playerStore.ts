import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import { useRef } from "react";
import { create } from "zustand";

import {
  LibraryItemAudioFileSchemaType,
  LibraryItemSchemaType,
} from "@/db/schema";

// const initAudioPlayer = async () => {
// console.log("initing audio player");
// await Audio.setAudioModeAsync({
//   staysActiveInBackground: true,
//   playsInSilentModeIOS: true,
//   interruptionModeIOS: InterruptionModeIOS.DoNotMix,
//   interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
//   playThroughEarpieceAndroid: true,
// });
// };
// initAudioPlayer();

const handlePlay = async (audioFile: LibraryItemAudioFileSchemaType) => {
  if (!audioFile.path) {
    console.warn(`AudioFile's path is undefined: ${audioFile.name}`);
    return;
  }

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
  return sound;
};

export interface PlayerState {
  audioObject: Sound | null;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  skipBack: (millis: number) => void;
  skipForward: (millis: number) => void;
  playlist: LibraryItemAudioFileSchemaType[] | null;
  setPlaylist: (playlist: LibraryItemAudioFileSchemaType[]) => void;
  currentTrack: LibraryItemAudioFileSchemaType | null;
  setCurrentTrack: (audioFile: LibraryItemAudioFileSchemaType) => void;
  changeTrack: (change: number) => void;
}

export const usePlayerState = create<PlayerState>()((set, get) => ({
  audioObject: null,
  isPlaying: false,
  play: async () => {
    if (!get().audioObject && get().currentTrack) {
      const sound = await handlePlay(
        get().currentTrack as LibraryItemAudioFileSchemaType,
      );
      set(() => ({ audioObject: sound }));
    }
    get().audioObject?.playAsync();
    set(() => ({ isPlaying: true }));
    // set(async (state) => {
    //   if (!state.audioObject) {
    //     const sound = await handlePlay(
    //       state.currentTrack as LibraryItemAudioFileSchemaType,
    //     );
    //     // await Audio.Sound.createAsync(
    //     //   { uri: state.currentTrack?.path as string },
    //     //   {
    //     //     shouldPlay: true,
    //     //   },
    //     // );
    //     return { ...state, audioObject: sound, isPlaying: true };
    //   } else {
    //     state.audioObject.playAsync();
    //     return { ...state, isPlaying: true };
    //   }
    // });
  },
  pause: () => {
    set((state) => {
      if (!state.audioObject) {
        console.log("nothing currently playing");
        return { ...state };
      }

      state.audioObject.pauseAsync();
      return { ...state, isPlaying: false };
      // Audio.Sound.
      // await Audio.Sound.createAsync(
      //   { uri: state.currentTrack?.path as string },
      //   {
      //     shouldPlay: true,
      //   },
      // );
      // }
      // return { ...state, isPlaying: true };
    });
  },
  skipBack: (millis) => console.log("skipping back"),
  skipForward: (millis) => console.log("skipping forward"),
  playlist: null,
  setPlaylist: (playlist) => set(() => ({ playlist })),
  currentTrack: null,
  setCurrentTrack: (audioFile) => set(() => ({ currentTrack: audioFile })),
  changeTrack: (change: number) =>
    set((state) => {
      if (!state.playlist) {
        console.log("when playlist isn't loaded, nothing to return");
        return { ...state, currentTrack: null };
      }

      // filter playlist to playable media
      const playableMedia = state.playlist.filter(
        (audioFile) => audioFile.path,
      );

      if (!state.currentTrack) {
        console.log("when currentTrack isn't set, start at the beginning");
        return { ...state, currentTrack: playableMedia[0] };
      }

      if (!state.currentTrack.path) {
        console.log("when currentTrack isn't playable, start at the beginning");
        return { ...state, currentTrack: playableMedia[0] };
      }

      const index =
        playableMedia.findIndex(
          (audioFile) => audioFile.name === state.currentTrack?.name,
        ) + change;

      if (index < 0) {
        console.log("if first track go to last");
        return {
          ...state,
          currentTrack: state.playlist[state.playlist.length - 1],
        };
      } else if (index > state.playlist.length) {
        // TODO: this doesn't seem to work???
        console.log("if las track go to beginning");
        return { ...state, currentTrack: state.playlist[0] };
      } else {
        console.log(`go to track ${index + change}`);
        return { ...state, currentTrack: state.playlist[index] };
      }
    }),
}));
