import { AudioPlayer, createAudioPlayer } from "expo-audio";
import { create } from "zustand";

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
  _activeTrack: Track | null;
  _queue: Track[];

  getActiveTrack: () => Track | null;
  getQueue: () => Track[];
  skipToNext: () => void;
  skipToPrevious: () => void;
  jumpBackward: (seconds: number) => void;
  jumpForward: (seconds: number) => void;
  isPlaying: () => boolean;

  play: () => void;
  pause: () => void;
  resume: () => void;
  skip: (index: number, position?: number) => void;
  reset: () => void;
  add: (tracks: Track[]) => void;
  seekTo: (position: number) => void;
  progress: () => number;
  duration: () => number;
  getRate: () => number;
  setRate: (rate: number) => void;
}

export const useTrackPlayer = create<TrackPlayerStore>()((set, get) => ({
  _player: createAudioPlayer(),
  _activeTrack: null,
  _queue: [],
  isPlaying: () => {
    return get()._player.playing;
  },
  getActiveTrack: () => {
    return get()._activeTrack;
  },
  getQueue: () => {
    return get()._queue;
  },
  play: () => {
    // if (track) {
    //   set({ _activeTrack: track });
    // }

    // const player = get()._player;
    // player.replace(track ? track.uri : get()._activeTrack?.uri || "");
    get()._player.play();
  },
  pause: () => {
    get()._player.pause();
  },

  resume: () => {
    get()._player.play();
  },
  seekTo: (position: number) => {
    get()._player.seekTo(position);
  },
  progress: () => {
    return get()._player.currentTime;
  },
  duration: () => {
    return get()._player.duration;
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
    set({ _activeTrack: track });
    const player = get()._player;
    player.replace(track.uri);
    if (position !== undefined) {
      player.seekTo(position);
    }
  },
  reset: () => {
    // Implementation to reset the player
    set({ _activeTrack: null });
    // Add logic to interface with actual audio playback library
  },
  add: (tracks: Track[]) => {
    // Implementation to add tracks to the queue
    set((state) => ({ _queue: [...state._queue, ...tracks] }));
    // Add logic to interface with actual audio playback library
  },
  skipToNext: () => {
    const queue = get()._queue;
    const activeTrack = get()._activeTrack;
    if (!activeTrack) return;
    const currentIndex = queue.findIndex((t) => t.id === activeTrack.id);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      get().skip(currentIndex + 1);
    }
  },
  skipToPrevious: () => {
    const queue = get()._queue;
    const activeTrack = get()._activeTrack;
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
