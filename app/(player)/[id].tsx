import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { localDb } from "@/db";
import {
  LibraryItemSchemaType,
  libraryItemAudioFileSchema,
  libraryItemSchema,
} from "@/db/schema";
import { usePlayerState } from "@/stores/playerStore";

export default function Player() {
  const { id } = useLocalSearchParams();
  // const [media, setMedia] = useState<
  //   LibraryItemAudioFileSchemaType | null | undefined
  // >(null);
  const playerState = usePlayerState();

  useEffect(() => {
    // const fetchData = async () => {
    // const re = await readOne(parseInt(id as string));
    // if (re) {
    //   setMedia(re);
    //   const { sound, status } = await Audio.Sound.createAsync(
    //     { uri: re.link },
    //     { shouldPlay: false },
    //   );
    //   if (status.isLoaded) {
    //     playerState._playbackDriver = sound;
    //     playerState.play();
    //   }
    // }
    // };

    const fetchData = async () => {
      const result = await localDb
        .select()
        .from(libraryItemSchema)
        .where(eq(libraryItemSchema.id, parseInt(id as string, 10)));
      playerState.setMedia(result[0]);

      const audioResults = await localDb
        .select()
        .from(libraryItemAudioFileSchema)
        .where(
          eq(
            libraryItemAudioFileSchema.libraryItemId,
            parseInt(id as string, 10),
          ),
        );
      // audioResults.forEach((aud) => console.log({ aud }));
      console.log(audioResults[0].path);
      playerState.setPlaylist(audioResults);
      const f = await FileSystem.readAsStringAsync(
        audioResults[0].path as string,
        {
          encoding: "base64",
        },
      );
      console.log(f);

      const s = await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: true,
      });

      const playback = await Audio.Sound.createAsync(
        { uri: audioResults[0].path as string },
        {
          shouldPlay: true,
        },
      );
      console.log(playback.status);
      playerState.setPlaybackDriver(playback.sound);
      // TODO: figure this out
      // const result = localDb.query.libraryItemSchema.findFirst({
      //   where: (libraryItemSchema, { eq }) =>
      //     eq(libraryItemSchema.id, parseInt(id as string, 10)),
      //   with: { libraryItemAudioFileSchema: true },
      // });
      // setLibraryItem(result);
    };

    fetchData();
  }, []);

  useEffect(() => {
    // const s = await Audio.setAudioModeAsync({
    //   staysActiveInBackground: true,
    //   playsInSilentModeIOS: true,
    //   interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    //   interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    //   playThroughEarpieceAndroid: true,
    // });
    // const { sound } = await Audio.Sound.createAsync(
    //     { uri: playerState.source.link },
    //     { shouldPlay: player.playing },
    //   );
    //   player.internal = sound;
    //   player.internal?.setOnPlaybackStatusUpdate((s: AVPlaybackStatus) => {
    //     if (s.isLoaded) {
    //       const durationMillis = s.durationMillis ?? 1;
    //       const durationRemainingMillis = durationMillis - s.positionMillis;
    //       setPlayer((prev) => {
    //         return {
    //           ...prev,
    //           positionMillis: s.positionMillis,
    //           percentComplete: Math.round(
    //             (s.positionMillis / durationMillis) * 100,
    //           ),
    //           durationMillis,
    //           durationRemainingMillis,
    //         };
    //       });
    //     }
    //   });
    // }
    // return sound
    //   ? () => {
    //       sound.unloadAsync();
    //     }
    //   : undefined;
  }, [playerState.currentTrack]);

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      {playerState.media && (
        <View className="flex h-screen gap-2 bg-slate-800 p-2">
          <TopActionsBar />
          <MediaArt />
          <MediaInfo media={playerState.media} />
          <MediaControls />
          {/*<MediaActionsBar media={media} />
        <MediaSummary />
        <MediaTracks /> */}
        </View>
      )}
    </SafeAreaView>
  );
}

const TopActionsBar = () => {
  return (
    <View>
      <Link href="..">
        {/* TODO: swipe down to dismiss, should animate down like a modal, back to where we came from, swipe left and right to go back and forward through tracks */}
        <Ionicons name="chevron-down" size={24} color="white" />
      </Link>
    </View>
  );
};

const MediaArt = () => {
  return (
    <View className="m-4 items-start justify-center">
      <View className="h-[300px] w-full rounded bg-slate-400">
        <Text className="text-white">FSR</Text>
      </View>
    </View>
  );
};

const MediaInfo = ({ media }: { media: LibraryItemSchemaType }) => {
  return (
    <View className="">
      <Text className="text-2xl text-white">{media.title}</Text>
    </View>
  );
};

const MediaControls = () => {
  const playerState = usePlayerState();

  return (
    <View className="flex flex-row items-center justify-evenly rounded-b bg-slate-400 p-1">
      {/* <Ionicons name="bookmark-outline" size={30} color="black" /> */}
      <Ionicons name="play-skip-back-sharp" size={30} color="black" />
      <FontAwesome6
        onPress={() => playerState.skipBack(30)}
        name="arrow-rotate-left"
        size={30}
        color="black"
      />
      {playerState.playing ? (
        <Ionicons
          onPress={playerState.stop}
          name="pause"
          size={40}
          color="black"
        />
      ) : (
        <Ionicons
          onPress={playerState.play}
          name="play-sharp"
          size={40}
          color="black"
        />
      )}
      <FontAwesome6
        onPress={() => playerState.skipForward(30)}
        name="arrow-rotate-right"
        size={30}
        color="black"
      />
      <Ionicons name="play-skip-forward" size={30} color="black" />
    </View>
  );
};
