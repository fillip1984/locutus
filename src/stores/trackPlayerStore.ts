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
  currentTrack: Track | null;
  isPlaying: boolean;

  playTrack: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
}

export const TrackPlayer = create<TrackPlayerStore>()((set, get) => ({
  _player: createAudioPlayer(),
  currentTrack: null,
  isPlaying: false,

  playTrack: async (track: Track) => {
    // Implementation to play the track
    set({ currentTrack: track, isPlaying: true });
    // Add logic to interface with actual audio playback library
    get()._player.replace(track.uri);
  },

  pause: async () => {
    // Implementation to pause playback
    set({ isPlaying: false });
    // Add logic to interface with actual audio playback library
    get()._player.pause();
  },

  resume: async () => {
    // Implementation to resume playback
    set({ isPlaying: true });
    // Add logic to interface with actual audio playback library
  },
}));
