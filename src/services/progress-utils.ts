// Local progress columns are percentages (0-100); Audiobookshelf uses fractions (0-1).
// Update objects in this module always carry the server representation (fractions).

export const formatSecondsToTime = (
  seconds: number,
  format: "timestamp" | "duration",
) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  // rounding before splitting avoids "01:60"
  const total =
    format === "duration" ? Math.floor(safeSeconds) : Math.round(safeSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (format === "duration") {
    const hoursDisplay = h > 0 ? `${h}h ` : "";
    const minutesDisplay = m > 0 ? `${m}m ` : "";
    return `${hoursDisplay}${minutesDisplay}`.trim();
  }
  // padStart ensures there are always two digits
  if (h > 0) {
    return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
  }
  return [m, s].map((v) => v.toString().padStart(2, "0")).join(":");
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const percentToFraction = (percent: number) =>
  clamp(percent / 100, 0, 1);

export const fractionToPercent = (fraction: number) =>
  Math.round(clamp(fraction, 0, 1) * 100000) / 1000;

export const calculateLocalProgress = (
  position: number,
  totalDuration: number,
) => {
  const location = Number.isFinite(position) ? Math.max(0, position) : 0;
  if (!(totalDuration > 0)) {
    // unknown duration: keep the position but don't invent a percentage
    return { audiobookLocation: location, complete: false };
  }
  const clamped = Math.min(location, totalDuration);
  return {
    audiobookLocation: clamped,
    audiobookProgress: fractionToPercent(clamped / totalDuration),
    complete: clamped >= totalDuration - 1,
  };
};

interface MediaProgressUpdate {
  libraryItemId: string;
  isFinished?: boolean;
  updatedAt: number;
  type: "ebook" | "audioBook";
  source: "client" | "server";
}

export interface EBookProgressUpdate extends MediaProgressUpdate {
  type: "ebook";
  ebookLocation: string;
  ebookProgress: number;
}

export interface AudioBookProgressUpdate extends MediaProgressUpdate {
  type: "audioBook";
  currentTime: number;
  progress: number;
  duration?: number;
}

export type ProgressUpdate = EBookProgressUpdate | AudioBookProgressUpdate;

export interface Root {
  id: string;
  username: string;
  mediaProgress: MediaProgress[];
  lastSeen: number;
}

export interface MediaProgress {
  id: string;
  userId: string;
  libraryItemId: string;
  episodeId?: string | number | null;
  mediaItemId: string;
  mediaItemType: string;
  duration: number;
  progress: number;
  currentTime: number;
  isFinished: boolean;
  hideFromContinueListening: boolean;
  ebookLocation?: string;
  ebookProgress: number;
  lastUpdate: number;
  startedAt: number;
  finishedAt: number | null;
}

export const selectServerUpdates = (
  mediaProgress: MediaProgress[],
  lastSync: number,
) => {
  const results: ProgressUpdate[] = [];

  for (const serverMedia of mediaProgress) {
    // podcast episodes share a libraryItemId with their show
    if (serverMedia.episodeId) continue;
    // TODO: this might be a bug! when sync'ing things ping pong since either their is an async not being awaited or a precision error. First the client updates the server, then the server updates the client with the exact same progress
    if (!(serverMedia.lastUpdate - lastSync > 1000)) continue;

    // a currentTime of 0 is valid (item marked unread); ebooks have neither duration nor time
    if (serverMedia.duration > 0 || serverMedia.currentTime > 0) {
      results.push({
        libraryItemId: serverMedia.libraryItemId,
        currentTime: serverMedia.currentTime,
        progress: serverMedia.progress,
        updatedAt: serverMedia.lastUpdate,
        isFinished: serverMedia.isFinished,
        type: "audioBook",
        source: "server",
      });
    }

    if (serverMedia.ebookLocation) {
      results.push({
        libraryItemId: serverMedia.libraryItemId,
        ebookLocation: serverMedia.ebookLocation,
        ebookProgress: serverMedia.ebookProgress,
        updatedAt: serverMedia.lastUpdate,
        isFinished: serverMedia.isFinished,
        type: "ebook",
        source: "server",
      });
    }
  }
  return results;
};

// newest update wins per item and media type; on a tie the first one (server) is kept
export const mergeProgressUpdates = (updates: ProgressUpdate[]) => {
  const merged = new Map<string, ProgressUpdate>();
  for (const update of updates) {
    const key = `${update.libraryItemId}:${update.type}`;
    const existing = merged.get(key);
    if (!existing || update.updatedAt > existing.updatedAt) {
      merged.set(key, update);
    }
  }
  return [...merged.values()];
};

// stops progress that came from (or already matches) the server from being pushed back
export const isAlreadyOnServer = (
  update: ProgressUpdate,
  mediaProgress: MediaProgress[],
) => {
  const serverMedia = mediaProgress.find(
    (m) => m.libraryItemId === update.libraryItemId && !m.episodeId,
  );
  if (!serverMedia) return false;
  if (!!serverMedia.isFinished !== !!update.isFinished) return false;
  if (update.type === "audioBook") {
    return Math.abs(serverMedia.currentTime - update.currentTime) < 1;
  }
  return serverMedia.ebookLocation === update.ebookLocation;
};

// explicit fields only, one entry per item so an ebook entry can't reset audio progress
export const buildServerPayload = (updates: ProgressUpdate[]) => {
  const payload = new Map<string, Record<string, unknown>>();
  for (const update of updates) {
    const entry = payload.get(update.libraryItemId) ?? {
      libraryItemId: update.libraryItemId,
    };
    entry.isFinished = !!update.isFinished;
    if (update.type === "audioBook") {
      entry.duration = update.duration ?? 0;
      entry.progress = clamp(update.progress, 0, 1);
      entry.currentTime = update.currentTime;
    } else {
      entry.ebookLocation = update.ebookLocation;
      entry.ebookProgress = clamp(update.ebookProgress, 0, 1);
    }
    payload.set(update.libraryItemId, entry);
  }
  return [...payload.values()];
};
