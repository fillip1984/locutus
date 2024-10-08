import { eq } from "drizzle-orm";
import TrackPlayer, {
  Event,
  PlaybackActiveTrackChangedEvent,
  PlaybackProgressUpdatedEvent,
} from "react-native-track-player";

import { localDb } from "@/db";
import { libraryItemAudioFileSchema, libraryItemSchema } from "@/db/schema";

export async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, skipToNext);
  TrackPlayer.addEventListener(Event.RemotePrevious, skipToPrevious);
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, jumpBackward);
  TrackPlayer.addEventListener(Event.RemoteJumpForward, jumpForward);

  TrackPlayer.addEventListener(
    Event.PlaybackActiveTrackChanged,
    async (e: PlaybackActiveTrackChangedEvent) => {
      // console.log(
      //   "There seems to be a bug where position is reported as 0 just prior to playing and reporting actual position",
      // );
      if (e.lastTrack && e.lastPosition > 0) {
        const complete = (e.lastTrack?.duration as number) - e.lastPosition < 1;
        // console.log(
        //   `track changed, update audio file: ${e.lastTrack.title}, progress: ${e.lastPosition}, mark as complete? ${complete}`,
        // );
        updateProgress(e.lastTrack.id, e.lastPosition, complete);
      }
    },
  );
  TrackPlayer.addEventListener(
    Event.PlaybackProgressUpdated,
    async (e: PlaybackProgressUpdatedEvent) => {
      const track = await TrackPlayer.getActiveTrack();
      let audioFile = undefined;
      let libraryItem = undefined;
      if (track) {
        audioFile = await localDb.query.libraryItemAudioFileSchema.findFirst({
          where: eq(libraryItemAudioFileSchema.id, track.id),
        });

        if (audioFile && audioFile.libraryItemId) {
          libraryItem = await localDb.query.libraryItemSchema.findFirst({
            where: eq(libraryItemSchema.id, audioFile.libraryItemId),
          });
        }

        const complete = e.duration - e.position < 1;

        if (e.position > 0) {
          // console.log(
          //   `update audio file: ${track.title}, progress: ${e.position}, mark as complete? ${complete}`,
          // );
          // console.log(
          //   "There seems to be a bug where position is reported as 0 just prior to playing and reporting actual position",
          // );
          updateProgress(track.id, e.position, complete);
        }

        if (libraryItem && audioFile) {
          // TODO: figure out how to mark the library item as complete
          // console.log(
          //   `update library item: ${libraryItem.title}, complete: false, lastPlayedId: ${audioFile.name}`,
          // );
          localDb
            .update(libraryItemSchema)
            .set({
              complete: false,
              lastPlayedId: audioFile.id,
              updatedAt: new Date(),
            })
            .where(eq(libraryItemSchema.id, libraryItem.id))
            .run();
        }
      }
    },
  );
}

export const fetchInitialPosition = async (indexChange: number) => {
  const activeTrackIndex = await TrackPlayer.getActiveTrackIndex();

  if (activeTrackIndex !== undefined) {
    const track = await TrackPlayer.getTrack(activeTrackIndex + indexChange);
    if (track) {
      const audioFile =
        await localDb.query.libraryItemAudioFileSchema.findFirst({
          where: eq(libraryItemAudioFileSchema.id, track.id),
        });

      if (audioFile) {
        // console.log(`returning progress: ${audioFile.progress}`);
        return audioFile.progress;
      }
    }
  }
};

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

export const updateProgress = async (
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

export const skipToNext = async () => {
  TrackPlayer.skipToNext((await fetchInitialPosition(1)) ?? 0);
};

export const skipToPrevious = async () => {
  TrackPlayer.skipToPrevious((await fetchInitialPosition(-1)) ?? 0);
};

export const jumpBackward = () => {
  TrackPlayer.seekBy(-30);
};
export const jumpForward = () => {
  TrackPlayer.seekBy(30);
};
