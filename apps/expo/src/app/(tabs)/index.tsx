import type { AVPlaybackStatus } from "expo-av";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Link } from "expo-router";

import type { PlayerType, PlaylistItemType } from "@acme/validators";

import { readAll } from "~/store/mediaStore";

export default function Index() {
  const [playlist, setPlaylist] = useState<PlaylistItemType[]>([]);
  const [player, setPlayer] = useState({
    playing: false,
    source: undefined,
    internal: undefined,
  } as PlayerType);

  useEffect(() => {
    // TODO: replace with Tanstack?
    const fetchData = async () => {
      setPlaylist(await readAll());
    };
    void fetchData();
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
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen gap-4 bg-slate-800 p-4">
        {playlist.length === 0 && (
          <View className="flex h-screen items-center justify-center">
            <Text className="text-2xl text-white">
              There&apos;s nothing to play
            </Text>
          </View>
        )}

        {playlist.map((media) => (
          <Link href={`/media/${media.id}`} key={media.title} asChild>
            <Pressable className="h-24 w-full rounded bg-slate-400 p-2">
              <Text>{media.title}</Text>
            </Pressable>
          </Link>
        ))}

        {/* {player.source?.title && (
          <AudioPlayer player={player} setPlayer={setPlayer} />
        )}

        {player.source?.title && (
          <MinimizedAudioPlayer player={player} setPlayer={setPlayer} />
        )} */}
      </View>
    </SafeAreaView>
  );
}
