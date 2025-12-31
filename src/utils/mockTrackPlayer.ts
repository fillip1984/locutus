// export default {
//   addEventListener: (event: any, handler: any) => {},
//   play: () => {},
//   pause: () => {},
//   skipToNext: (position: number) => {},
//   skipToPrevious: (position: number) => {},
//   seekBy: (seconds: number) => {},
//   getActiveTrack: async () => {},
//   getActiveTrackIndex: async () => {},
//   getTrack: async (index: number) => {},
// };

export default {
  addEventListener: () => {},
  play: () => {},
  pause: () => {},
  skipToNext: () => {},
  skipToPrevious: () => {},
  seekBy: () => {},
  getActiveTrack: () => {},
  getActiveTrackIndex: () => {},
  getTrack: () => {},
  getQueue: () => {},
  skip: () => {},
  reset: () => {},
  add: () => {},
  seekTo: () => {},
  getRate: () => {},
  setRate: () => {},
};

export const Event = {
  PlaybackState: "playback-state",
  PlaybackError: "playback-error",
  TrackChanged: "track-changed",
  QueueEnded: "queue-ended",
  RemotePlay: "remote-play",
  RemotePause: "remote-pause",
  RemoteNext: "remote-next",
  RemotePrevious: "remote-previous",
  RemoteJumpBackward: "remote-jump-backward",
  RemoteJumpForward: "remote-jump-forward",
  PlaybackActiveTrackChanged: "playback-active-track-changed",
  PlaybackProgressUpdated: "playback-progress-updated",
  // Add other event constants as needed
};

export const State = {
  Playing: "playing",
  Paused: "paused",
  Stopped: "stopped",
  Buffering: "buffering",
  Connecting: "connecting",
};

export type PlaybackActiveTrackChangedEvent = {
  lastTrack: {
    id: string;
    title: string;
    duration: number;
  } | null;
  lastPosition: number;
};

export type PlaybackProgressUpdatedEvent = {
  position: number;
  duration: number;
};

export type Track = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  url: string;
  duration?: number;
};

export const useActiveTrack = () => {};
export const useProgress = () => {
  return { position: 0, duration: 0 };
};
export const usePlaybackState = () => {
  return { state: State.Paused };
};
