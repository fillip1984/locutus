import { eq } from "drizzle-orm";
import Toast from "react-native-toast-message";
import TrackPlayer, {
  Event,
  PlaybackProgressUpdatedEvent,
} from "react-native-track-player";
import { create } from "zustand";

import { useMediaState } from "./mediaStore";

import { localDb } from "@/db";
import {
  LibraryItemAudioFileSchemaType,
  libraryItemAudioFileSchema,
  libraryItemSchema,
} from "@/db/schema";

export const skipInterval = 30;

export interface PlayerState {
  isPlaying: boolean;
  playlist: LibraryItemAudioFileSchemaType[] | null;
  currentTrack: LibraryItemAudioFileSchemaType | null;
  position: number;
  duration: number;
  durationRemaining: number;
  percentComplete: number;
  rate: number;
  progressUpdateCounter: number;
  play: ({
    audioFile,
    startingPosition,
  }: {
    audioFile?: LibraryItemAudioFileSchemaType;
    startingPosition?: number;
  }) => Promise<boolean>;
  pause: () => void;
  skipBack: () => void;
  skipForward: () => void;
  setPlaylist: (playlist: LibraryItemAudioFileSchemaType[]) => void;
  changeTrack: (change: number) => void;
  setRate: () => void;
}

export const usePlayerState = create<PlayerState>()((set, get) => ({
  isPlaying: false,
  playlist: null,
  currentTrack: null,
  position: 0,
  duration: 0,
  durationRemaining: 0,
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
    // 1) scenario is to simply resuming play of current track
    if (!audioFile && !startingPosition) {
      TrackPlayer.play();
      set(() => ({ isPlaying: true }));
      return true;
    }

    // 1b) scenario is new starting position given (user scrubbed track)
    if (!audioFile && startingPosition) {
      TrackPlayer.seekTo(startingPosition ? startingPosition : 0);
      return true;
    }

    // 2) scenario covers a track change or starting player
    const activeTrack = await TrackPlayer.getActiveTrack();
    if (audioFile && audioFile.name !== activeTrack?.title) {
      // console.log("clearing queue and stopping current playback");
      await TrackPlayer.reset();
      // console.log("switching to given audioFile");
      const libraryItem = useMediaState.getState().libraryItem;
      await TrackPlayer.add({
        title: audioFile.name,
        artist: libraryItem?.authorName ?? "unknown",
        album: libraryItem?.title ?? "unknown",
        artwork: libraryItem?.coverArtPath ?? "unknown",
        url: audioFile.path as string,
        duration: audioFile.duration / 1000,
      });

      TrackPlayer.addEventListener(
        Event.PlaybackProgressUpdated,
        async (e: PlaybackProgressUpdatedEvent) => {
          // console.log(
          //   "update duration, position, duration remaining so we can render the progress bar",
          // );
          const durationRemaining = e.duration - e.position;
          set(() => ({
            duration: e.duration,
            position: e.position,
            durationRemaining,
            percentComplete: Math.round((e.position / e.duration) * 100),
          }));

          if ((get().progressUpdateCounter + 1) % 30 === 0) {
            // console.log(
            //   "periodically update database with current position so that we can resume where we left off, progress: " +
            //     e.position * 1000,
            // );
            const audioFileId = get().currentTrack?.id;
            if (audioFileId) {
              localDb
                .update(libraryItemAudioFileSchema)
                .set({ progress: e.position * 1000 })
                .where(eq(libraryItemAudioFileSchema.id, audioFileId))
                .run();
            }
          }
          set((state) => ({
            progressUpdateCounter: state.progressUpdateCounter + 1,
          }));

          // console.log("go to next track at end of this track");
          if (durationRemaining <= 0) {
            if (audioFile.libraryItemId) {
              // TODO: move entire item to complete when all audio files are complete
              // localDb
              //   .update(libraryItemSchema)
              //   .set({ complete: true })
              //   .where(eq(libraryItemSchema.id, audioFile.libraryItemId))
              //   .run();
              localDb
                .update(libraryItemAudioFileSchema)
                .set({ complete: true, progress: null })
                .where(eq(libraryItemAudioFileSchema.id, audioFile.id))
                .run();
            }
            get().changeTrack(1);
          }
        },
      );

      // TODO: any scenarios where given starting position should override recorded position???
      // console.log("if starting position was given, use it, else start at 0");
      TrackPlayer.seekTo(audioFile.progress ? audioFile.progress / 1000 : 0);
      TrackPlayer.play();
      // console.log("update player state");
      set(() => ({ isPlaying: true, currentTrack: audioFile }));

      // console.log("update library item state");
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
      return true;
    }

    // 3) scenario is unknown so no action was taken
    // console.log("Unexpected scenario");
    // Toast.show({
    //   type: "error",
    //   text1: "No action taken, unexpected scenario occurred",
    // });
    return false;
  },
  pause: () => {
    // set((state) => {
    //   state.audioObject?.pauseAsync();
    //   return { ...state, isPlaying: false };
    // });
    TrackPlayer.pause();
    set(() => ({ isPlaying: false }));
  },
  skipBack: () => {
    TrackPlayer.seekTo(get().position - skipInterval);
  },
  skipForward: () => {
    TrackPlayer.seekTo(get().position + skipInterval);
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
    TrackPlayer.setRate(newRate);
    set(() => ({ rate: newRate }));
  },
}));
