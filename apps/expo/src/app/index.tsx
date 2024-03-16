import type { AVPlaybackStatus } from "expo-av";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

import type { PlayerType, PlaylistItemType } from "@acme/validators";

import AudioPlayer from "./_components/AudioPlayer";
import MinimizedAudioPlayer from "./_components/MinimizedAudioPlayer";

export default function Index() {
  const [player, setPlayer] = useState({
    playing: false,
    source: undefined,
    internal: undefined,
  } as PlayerType);
  const playlist: PlaylistItemType[] = [
    {
      title: "Comfort Fit - 'Sorry'",
      link: "https://s3.amazonaws.com/exp-us-standard/audio/playlist-example/Comfort_Fit_-_03_-_Sorry.mp3",
      video: false,
    },
    {
      title: "Big Buck Bunny",
      link: "http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
      video: true,
    },
    {
      title: "Mildred Bailey – “All Of Me”",
      link: "https://ia800304.us.archive.org/34/items/PaulWhitemanwithMildredBailey/PaulWhitemanwithMildredBailey-AllofMe.mp3",
      video: false,
    },

    {
      title: "Popeye - I don't scare",
      link: "https://ia800501.us.archive.org/11/items/popeye_i_dont_scare/popeye_i_dont_scare_512kb.mp4",
      video: true,
    },

    {
      title: "Podington Bear - “Rubber Robot”",
      link: "https://s3.amazonaws.com/exp-us-standard/audio/playlist-example/Podington_Bear_-_Rubber_Robot.mp3",
      video: false,
    },
    {
      title: "Ray Charles - I can't stop loving you",
      link: "https://ia801302.us.archive.org/19/items/ICantStopLovingYou/07.ICantStopLovingYou1.mp3",
      video: false,
    },
  ];

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
    console.log({ playing: player.playing });
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
            <Text>{media.title}</Text>
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
