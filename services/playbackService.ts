import { eq } from "drizzle-orm";
import TrackPlayer, {
  Event,
  PlaybackProgressUpdatedEvent,
} from "react-native-track-player";

import { localDb } from "@/db";
import { libraryItemAudioFileSchema, libraryItemSchema } from "@/db/schema";

export async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, async () =>
    TrackPlayer.skipToNext((await fetchInitialPosition(1)) ?? 0),
  );
  TrackPlayer.addEventListener(Event.RemotePrevious, async () =>
    TrackPlayer.skipToPrevious((await fetchInitialPosition(-1)) ?? 0),
  );
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, () =>
    TrackPlayer.seekBy(-30),
  );
  TrackPlayer.addEventListener(Event.RemoteJumpForward, () =>
    TrackPlayer.seekBy(30),
  );
  // TODO: seems to be a bug, progress is always undefined
  // TrackPlayer.addEventListener(
  //   Event.PlaybackActiveTrackChanged,
  //   async (e: PlaybackActiveTrackChangedEvent) => {
  //     if (e.lastTrack) {
  //       console.log({
  //         lastTitle: e.lastTrack?.title,
  //         lastPosition: e.lastTrack?.position,
  //         title: e.track?.title,
  //         position: "???",
  //       });
  //       const complete = (e.lastTrack?.duration as number) - e.lastPosition < 1;
  //       // console.log(
  //       //   `mark file as complete if within 1 second of completing track, else update complete to false and mark progress. Complete: ${complete}, progress: ${e.lastPosition}`,
  //       // );
  //       localDb
  //         .update(libraryItemAudioFileSchema)
  //         .set({
  //           complete,
  //           progress: complete ? 0 : e.lastPosition,
  //         })
  //         .where(eq(libraryItemAudioFileSchema.id, e.lastTrack.id))
  //         .run();
  //     }
  //   },
  // );
  TrackPlayer.addEventListener(
    Event.PlaybackProgressUpdated,
    async (e: PlaybackProgressUpdatedEvent) => {
      if (e.position === 0) {
        // console.warn(
        //   "There seems to be a bug where position is reported as 0 just prior to playing and reporting actual position",
        // );
        return;
      }
      const track = await TrackPlayer.getActiveTrack();
      if (track) {
        const complete = e.duration - e.position < 1;
        console.log(
          `update audio file: ${track.title}, progress: ${e.position}, mark as complete? ${complete}`,
        );
        localDb
          .update(libraryItemAudioFileSchema)
          .set({ complete, progress: e.position })
          .where(eq(libraryItemAudioFileSchema.id, track.id))
          .run();

        const audioFile =
          await localDb.query.libraryItemAudioFileSchema.findFirst({
            where: eq(libraryItemAudioFileSchema.id, track.id),
          });
        if (audioFile && audioFile.libraryItemId) {
          const libraryItem = await localDb.query.libraryItemSchema.findFirst({
            where: eq(libraryItemSchema.id, audioFile.libraryItemId),
          });
          if (libraryItem) {
            // console.log("update library item progress");
            localDb
              .update(libraryItemSchema)
              .set({ complete, lastPlayedId: track.id })
              .where(eq(libraryItemSchema.id, libraryItem.id))
              .run();
          }
        }
      }
    },
  );
}

export const fetchInitialPosition = async (indexChange: number) => {
  const activeTrackIndex = await TrackPlayer.getActiveTrackIndex();

  if (activeTrackIndex) {
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
