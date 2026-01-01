import { AudioPlayer, createAudioPlayer } from "expo-audio";
import { create } from "zustand";
import { localDb } from "@/db";
import { libraryItemAudioFileSchema, libraryItemSchema } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // in seconds
  artwork?: string; // URL or local path to artwork image
  uri: string; // URL or local path to audio file
}

export interface TrackPlayerStore {
  _player: AudioPlayer;
  _queue: Track[];
  activeTrack: Track | null;

  getQueue: () => Track[];
  reset: () => void;
  add: (tracks: Track[]) => void;
  skipToNext: () => void;
  skipToPrevious: () => void;

  play: () => void;
  skip: (index: number, position?: number) => void;

  pause: () => void;

  seekTo: (position: number) => void;
  jumpBackward: (seconds: number) => void;
  jumpForward: (seconds: number) => void;

  getRate: () => number;
  setRate: (rate: number) => void;
}

export const useTrackPlayer = create<TrackPlayerStore>()((set, get) => ({
  _player: createAudioPlayer(),
  activeTrack: null,
  _queue: [],
  getQueue: () => {
    return get()._queue;
  },
  play: () => {
    get()._player.play();
  },
  pause: () => {
    get()._player.pause();
  },
  seekTo: (position: number) => {
    get()._player.seekTo(position);
  },
  getRate: () => {
    // Implementation to get the current playback rate
    return get()._player.playbackRate;
  },
  setRate: (rate: number) => {
    // Implementation to set the playback rate
    get()._player.setPlaybackRate(rate);
  },
  skip: (index: number, position?: number) => {
    const queue = get()._queue;
    if (index < 0 || index >= queue.length) {
      throw new Error("Index out of bounds");
    }
    const track = queue[index];
    set({ activeTrack: track });
    const player = get()._player;
    player.replace(track.uri);
    if (position !== undefined) {
      player.seekTo(position);
    }
  },
  reset: () => {
    get()._player.pause();
    set({ activeTrack: null, _queue: [] });
  },
  add: (tracks: Track[]) => {
    // Implementation to add tracks to the queue
    set((state) => ({ _queue: [...state._queue, ...tracks] }));
    // Add logic to interface with actual audio playback library
  },
  skipToNext: () => {
    const queue = get()._queue;
    const activeTrack = get().activeTrack;
    if (!activeTrack) return;
    const currentIndex = queue.findIndex((t) => t.id === activeTrack.id);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      get().skip(currentIndex + 1);
    }
  },
  skipToPrevious: () => {
    const queue = get()._queue;
    const activeTrack = get().activeTrack;
    if (!activeTrack) return;
    const currentIndex = queue.findIndex((t) => t.id === activeTrack.id);
    if (currentIndex > 0) {
      get().skip(currentIndex - 1);
    }
  },
  jumpBackward: (seconds: number) => {
    const player = get()._player;
    player.seekTo(Math.max(0, player.currentTime - seconds));
  },
  jumpForward: (seconds: number) => {
    const player = get()._player;
    player.seekTo(Math.min(player.duration, player.currentTime + seconds));
  },
}));

export const fetchLibraryItemFromTrack = async (audioFileId: string) => {
  const audioFile = await localDb.query.libraryItemAudioFileSchema.findFirst({
    where: eq(libraryItemAudioFileSchema.id, audioFileId),
  });
  if (audioFile && audioFile.libraryItemId) {
    const libraryItem = await localDb.query.libraryItemSchema.findFirst({
      where: eq(libraryItemSchema.id, audioFile.libraryItemId),
    });
    return libraryItem;
  }
};

export const updateAudioFileProgress = async (
  audioFileId: string,
  position: number,
  complete: boolean,
) => {
  localDb
    .update(libraryItemAudioFileSchema)
    .set({ complete, progress: complete ? 0 : position, updatedAt: new Date() })
    .where(eq(libraryItemAudioFileSchema.id, audioFileId))
    .run();
};

export const updateLibraryItemProgress = async (
  libraryItemId: string,
  complete: boolean,
  lastPlayedId?: string,
) => {
  localDb
    .update(libraryItemSchema)
    .set({
      complete,
      lastPlayedId: lastPlayedId,
      updatedAt: new Date(),
    })
    .where(eq(libraryItemSchema.id, libraryItemId))
    .run();
};
