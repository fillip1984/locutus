import { eq } from "drizzle-orm";
import {
  AVPlaybackStatus,
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import { Sound } from "expo-av/build/Audio";
import Toast from "react-native-toast-message";
import { create } from "zustand";

import { localDb } from "@/db";
import {
  LibraryItemAudioFileSchemaType,
  libraryItemAudioFileSchema,
  libraryItemSchema,
} from "@/db/schema";

export interface PlayerState {
  audioObject: Sound | null;
  isPlaying: boolean;
  playlist: LibraryItemAudioFileSchemaType[] | null;
  currentTrack: LibraryItemAudioFileSchemaType | null;
  positionMillis: number;
  durationMillis: number;
  durationRemainingMillis: number;
  percentComplete: number;
  rate: number;
  progressUpdateCounter: number;
  play: ({
    audioFile,
    startingPosition,
  }: {
    audioFile?: LibraryItemAudioFileSchemaType;
    startingPosition?: number;
  }) => void;
  pause: () => void;
  skipBack: (millis: number) => void;
  skipForward: (millis: number) => void;
  setPlaylist: (playlist: LibraryItemAudioFileSchemaType[]) => void;
  changeTrack: (change: number) => void;
  setRate: () => void;
}

export const usePlayerState = create<PlayerState>()((set, get) => ({
  audioObject: null,
  isPlaying: false,
  playlist: null,
  currentTrack: null,
  positionMillis: 0,
  durationMillis: 0,
  durationRemainingMillis: 0,
  percentComplete: 0,
  rate: 1,
  progressUpdateCounter: 0,
  play: async ({
    audioFile,
    startingPosition,
  }: {
    audioFile?: LibraryItemAudioFileSchemaType;
    startingPosition?: number;
  }) => {
    // when given an audio file different from the one currently playing we are expressing our intention to swap the playback track
    if (audioFile && audioFile.id !== get().currentTrack?.id) {
      await get().audioObject?.unloadAsync();
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
          shouldPlay: false,
        },
      );
      sound.playFromPositionAsync(audioFile.progress ?? 0);

      // updates position of track
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          // defaults to 1 so we don't divide by 0 when calculating percentComplete
          const durationMillis = status.durationMillis ?? 1;
          const durationRemainingMillis =
            durationMillis - status.positionMillis;
          set((state) => ({
            durationMillis,
            durationRemainingMillis,
            positionMillis: status.positionMillis,
            percentComplete: Math.round(
              (status.positionMillis / durationMillis) * 100,
            ),
          }));

          // every xx seconds update progress so we can resume from last place left off
          set((state) => ({
            progressUpdateCounter: state.progressUpdateCounter + 1,
          }));
          if (get().progressUpdateCounter % 30 === 0) {
            const audioFileId = get().currentTrack?.id;
            if (audioFileId) {
              localDb
                .update(libraryItemAudioFileSchema)
                .set({ progress: status.positionMillis })
                .where(eq(libraryItemAudioFileSchema.id, audioFileId))
                .run();
            }
          }

          // go to next track at end of this track
          if (durationRemainingMillis <= 0) {
            if (audioFile.libraryItemId) {
              // TODO: move entire item to complete when all audio files are complete
              // localDb
              //   .update(libraryItemSchema)
              //   .set({ complete: true })
              //   .where(eq(libraryItemSchema.id, audioFile.libraryItemId))
              //   .run();
              localDb
                .update(libraryItemAudioFileSchema)
                .set({ complete: true, progress: 0 })
                .where(eq(libraryItemAudioFileSchema.id, audioFile.id))
                .run();
            }
            get().changeTrack(1);
          }
        }
      });

      // update state with new playback
      set(() => ({
        audioObject: sound,
        isPlaying: true,
        currentTrack: audioFile,
      }));

      if (audioFile.libraryItemId) {
        localDb
          .update(libraryItemSchema)
          .set({ lastPlayedId: audioFile.id, complete: false })
          .where(eq(libraryItemSchema.id, audioFile.libraryItemId))
          .run();
        localDb
          .update(libraryItemAudioFileSchema)
          .set({ complete: false })
          .where(eq(libraryItemAudioFileSchema.id, audioFile.id))
          .run();
      }
    } else {
      if (startingPosition !== undefined) {
        get().audioObject?.playFromPositionAsync(startingPosition);
      } else {
        // else, we are only intending to resume play of current track
        get().audioObject?.playAsync();
        set(() => ({ isPlaying: true }));
      }
    }
  },
  pause: () => {
    set((state) => {
      state.audioObject?.pauseAsync();
      return { ...state, isPlaying: false };
    });
  },
  skipBack: (millis) => {
    get().audioObject?.setPositionAsync(get().positionMillis - millis);
  },
  skipForward: (millis) => {
    get().audioObject?.setPositionAsync(get().positionMillis + millis);
  },
  setPlaylist: (playlist) => set(() => ({ playlist })),
  changeTrack: async (change: number) => {
    if (!get().playlist) {
      // console.log("when playlist isn't loaded, nothing to do");
      Toast.show({
        type: "error",
        text1: "no playlist",
      });
      return;
    }

    // filter playlist to playable media
    const playableMedia = get().playlist?.filter((audioFile) => audioFile.path);
    if (!playableMedia || playableMedia.length === 0) {
      // console.log("when there are no playable tracks, nothig to do");
      Toast.show({
        type: "error",
        text1: "no playable tracks",
      });
      return;
    }

    if (!get().currentTrack) {
      // console.log("when currentTrack isn't set, start at the beginning");
      get().play({ audioFile: playableMedia[0] });
    }

    if (!get().currentTrack?.path) {
      // console.log("when currentTrack isn't playable, start at the beginning");
      get().play({ audioFile: playableMedia[0] });
    }

    const index =
      playableMedia.findIndex(
        (audioFile) => audioFile.name === get().currentTrack?.name,
      ) + change;

    if (index < 0) {
      // console.log("if first track go to last");
      const lastTrack = playableMedia[playableMedia.length - 1];
      get().play({ audioFile: lastTrack });
    } else if (index >= playableMedia.length) {
      // console.log("if last track go to beginning");
      get().play({ audioFile: playableMedia[0] });
    } else {
      // console.log(`go to previous or next track ${index + change}`);
      get().play({ audioFile: playableMedia[index] });
    }
  },
  setRate: () => {
    // increments in .25, cycles back to .5x if over 2x
    const newRate = get().rate + 0.25 > 2 ? 0.5 : get().rate + 0.25;
    set(() => ({ rate: newRate }));
    get().audioObject?.setRateAsync(newRate, true);
  },
}));
