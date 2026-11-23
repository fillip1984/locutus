import type {
  PlayerQueue,
  TrackItem,
  TrackPlayer,
} from "react-native-nitro-player";

import type { TrackPlayerExtraPayload } from "@/app/_layout";
import type { libraryItemWithFilesSchemaType } from "@/db/schema";

type Queue = Pick<
  typeof PlayerQueue,
  | "createPlaylist"
  | "deletePlaylist"
  | "addTracksToPlaylist"
  | "loadPlaylist"
  | "getCurrentPlaylistId"
>;
type Player = Pick<typeof TrackPlayer, "getState" | "seek" | "play" | "pause">;

export async function skipToPreviousChapter(
  player: Pick<typeof TrackPlayer, "getState" | "skipToIndex">,
) {
  const { currentIndex } = await player.getState();
  if (currentIndex < 0) {
    throw new Error("No current track to skip from");
  }
  const skipped = await player.skipToIndex(Math.max(currentIndex - 1, 0));
  if (!skipped) throw new Error("Unable to skip to previous track");
}

export function createPlaylistSetup(
  queue: Queue,
  player: Player,
  resolvePath: (path: string) => string,
) {
  let previousSetup: Promise<boolean> = Promise.resolve(false);

  return (
    libraryItem: libraryItemWithFilesSchemaType,
    audiobookLocation: string | undefined,
    mode: "play" | "resume",
    isCancelled: () => boolean,
  ): Promise<boolean> => {
    const setup = async () => {
      if (isCancelled()) return false;

      if (mode === "resume") {
        const state = await player.getState();
        if (isCancelled()) return false;
        if (
          state.currentPlaylistId &&
          state.currentPlaylistId === queue.getCurrentPlaylistId() &&
          state.currentTrack?.extraPayload?.libraryItemId === libraryItem.id
        ) {
          return true;
        }
      }

      const chapters = [...libraryItem.audioChapters].sort(
        (a, b) => a.index - b.index,
      );
      if (chapters.length === 0) {
        throw new Error(`No audio chapters found for ${libraryItem.id}`);
      }

      const location = Number.parseFloat(
        audiobookLocation ?? String(libraryItem.audiobookLocation ?? 0),
      );
      const position = Number.isFinite(location) ? location : 0;
      const activeChapterIndex = chapters.findIndex(
        (chapter) => chapter.start <= position && chapter.end > position,
      );
      const playlistType =
        new Set(chapters.map((chapter) => chapter.mediaRemoteId)).size ===
        chapters.length
          ? "file-per-chapter"
          : "file-for-all-chapters";

      const tracks: TrackItem[] =
        playlistType === "file-per-chapter"
          ? chapters.map((chapter, index) => ({
              id: index.toString(),
              title: chapter.title,
              artist: libraryItem.authorName,
              album: libraryItem.title,
              duration: chapter.duration,
              url: resolvePath(
                `${libraryItem.remoteId}/${chapter.mediaRemoteId}${chapter.mediaFormat}`,
              ),
              artwork: libraryItem.coverArtPath ?? undefined,
              extraPayload: {
                playlistType,
                libraryItemId: libraryItem.id,
                start: chapter.start,
                totalDuration: libraryItem.audiobookDuration ?? 0,
              } satisfies TrackPlayerExtraPayload,
            }))
          : [
              {
                id: (chapters[activeChapterIndex]?.index ?? 0).toString(),
                title: chapters[activeChapterIndex]?.title ?? chapters[0].title,
                artist: libraryItem.authorName,
                album: libraryItem.title,
                duration: libraryItem.audiobookDuration ?? 0,
                url: resolvePath(
                  `${libraryItem.remoteId}/${chapters[0].mediaRemoteId}${chapters[0].mediaFormat}`,
                ),
                artwork: libraryItem.coverArtPath ?? undefined,
                extraPayload: {
                  playlistType,
                  chapters: chapters.map(({ index, title, start, end }) => ({
                    index,
                    title,
                    start,
                    end,
                  })),
                  libraryItemId: libraryItem.id,
                  start: 0,
                  totalDuration: libraryItem.audiobookDuration ?? 0,
                } satisfies TrackPlayerExtraPayload,
              },
            ];

      const id = await queue.createPlaylist(
        "Default Playlist",
        "Default queue",
      );
      let previousState: Awaited<ReturnType<Player["getState"]>> | undefined;
      let previousId: string | null = null;
      let committed = false;
      try {
        if (isCancelled()) return false;
        await queue.addTracksToPlaylist(id, tracks);
        if (isCancelled()) return false;

        previousState = await player.getState();
        if (isCancelled()) return false;
        previousId = queue.getCurrentPlaylistId();
        const startIndex =
          playlistType === "file-per-chapter" && activeChapterIndex !== -1
            ? activeChapterIndex
            : 0;
        await queue.loadPlaylist(id, startIndex);
        if (isCancelled()) return false;

        if (playlistType === "file-for-all-chapters") {
          // a finished book is saved at its end, so start it over instead
          const bookEnd =
            libraryItem.audiobookDuration ?? chapters[chapters.length - 1].end;
          await player.seek(position >= bookEnd ? 0 : position);
        } else if (activeChapterIndex !== -1) {
          await player.seek(position - chapters[activeChapterIndex].start);
        }
        if (isCancelled()) return false;
        await player.play();
        if (isCancelled()) return false;
        committed = true;
        if (previousId && previousId !== id) {
          try {
            await queue.deletePlaylist(previousId);
          } catch (error) {
            console.error("Unable to remove previous playlist", error);
          }
        }
        return true;
      } finally {
        let removed = false;
        if (!committed && queue.getCurrentPlaylistId() === id) {
          if (
            previousId &&
            previousState?.currentPlaylistId === previousId &&
            previousState.currentIndex >= 0
          ) {
            await queue.loadPlaylist(previousId, previousState.currentIndex);
            await player.seek(previousState.currentPosition);
            if (previousState.currentState === "playing") {
              await player.play();
            } else {
              await player.pause();
            }
          } else {
            await player.pause();
            await queue.deletePlaylist(id);
            removed = true;
          }
        }
        if (!removed && queue.getCurrentPlaylistId() !== id) {
          await queue.deletePlaylist(id);
        }
      }
    };

    const result = previousSetup.then(setup, setup);
    previousSetup = result;
    return result;
  };
}
