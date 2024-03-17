import type { AVPlaybackStatus } from "expo-av";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Link } from "expo-router";

import type { PlayerType, PlaylistItemType } from "@acme/validators";

import { readAll, testDB } from "~/utils/DBClient";
import AudioPlayer from "./_components/AudioPlayer";
import MinimizedAudioPlayer from "./_components/MinimizedAudioPlayer";

export default function Index() {
  const [playlist, setPlaylist] = useState<PlaylistItemType[]>([]);
  const [player, setPlayer] = useState({
    playing: false,
    source: undefined,
    internal: undefined,
  } as PlayerType);

  useEffect(() => {
    const migrateAndTest = async () => {
      console.log("testing out db");
      await testDB();
      console.log("tested out db");

      console.log("init state");
      setPlaylist(await readAll());
      console.log("inited state");
    };
    void migrateAndTest();
  }, []);

  useEffect(() => {
    const loadPlayerInternals = async () => {
      if (player.source) {
        void Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: player.source.link },
          { shouldPlay: player.playing },
        );

        player.internal = sound;
        player.internal?.setOnPlaybackStatusUpdate((s: AVPlaybackStatus) => {
          if (s.isLoaded) {
            const durationMillis = s.durationMillis ?? 1;
            const durationRemainingMillis = durationMillis - s.positionMillis;
            setPlayer((prev) => {
              return {
                ...prev,
                positionMillis: s.positionMillis,
                percentComplete: Math.round(
                  (s.positionMillis / durationMillis) * 100,
                ),
                durationMillis,
                durationRemainingMillis,
              };
            });
          }
        });
      }
    };
    void loadPlayerInternals();

    return void player.internal?.unloadAsync();
  }, [player.source]);

  useEffect(() => {
    if (player.playing) {
      void player.internal?.playAsync();
    } else {
      void player.internal?.pauseAsync();
    }

    return () => void player.internal?.stopAsync;
  }, [player.playing]);

  return (
    <SafeAreaView className="bg-slate-800">
      <View className="flex h-screen gap-2 bg-slate-800">
        {playlist.map((media) => (
          <Pressable
            onPress={() =>
              setPlayer((prev) => {
                return { ...prev, source: media };
              })
            }
            key={media.title}
            className="bg-slate-300 p-2">
            {/* <View> */}
            <Link href={"/media"}>{media.title}</Link>
            {/* </View> */}
          </Pressable>
        ))}

        {player.source?.title && (
          <AudioPlayer player={player} setPlayer={setPlayer} />
        )}

        {player.source?.title && (
          <MinimizedAudioPlayer player={player} setPlayer={setPlayer} />
        )}
      </View>
    </SafeAreaView>
  );
}
