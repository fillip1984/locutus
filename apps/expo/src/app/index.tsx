import type { AVPlaybackStatus } from "expo-av";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { Audio } from "expo-av";
import { format } from "date-fns";

import type { PlayerType, PlaylistItemType } from "@acme/validators";

import AudioPlayer from "./_components/AudioPlayer";

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

  // const player: PlayerType = {
  //   playing: false,
  //   source: undefined,
  //   internal: undefined,
  // };

  // useEffect(() => {
  //   player.source = playlist[0];
  //   console.log({ player });
  // }, [playlist]);

  // useEffect(() => {
  //   const loadPlayerInternals = async () => {
  //     if (player.source) {
  //       console.log({ playerBeforeInternals: player });
  //       const { sound } = await Audio.Sound.createAsync(
  //         { uri: player.source.link },
  //         { shouldPlay: false },
  //       );
  //       player.internal = sound;
  //       console.log({ playerAsInternals: player });
  //     }
  //   };
  //   void loadPlayerInternals();
  // }, [player.source]);

  useEffect(() => {
    const loadPlayerInternals = async () => {
      if (player.source) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: player.source.link },
          { shouldPlay: player.playing },
        );
        player.internal = sound;
        player.internal?.setOnPlaybackStatusUpdate((s: AVPlaybackStatus) => {
          if (s.isLoaded) {
            // console.log({ s });
            const durationMillis = s.durationMillis ?? 1;
            const durationRemaining = durationMillis - s.positionMillis;
            // console.log({
            //   durationRemaining,
            //   pos: s.positionMillis,
            //   posPerc: Math.round((s.positionMillis / s.durationMillis) * 100),
            // });
            setPlayer((prev) => {
              return {
                ...prev,
                position: format(s.positionMillis, "mm:ss"),
                percentComplete: Math.round(
                  (s.positionMillis / durationMillis) * 100,
                ),
                duration: format(durationMillis, "mm:ss"),
                durationRemaining: format(durationRemaining, "mm:ss"),
              };
            });
            // console.log({
            //   position: format(s.positionMillis, "mm:ss"),
            //   duration: format(s.durationMillis, "mm:ss"),
            //   playable_buffered: format(s.playableDurationMillis, "mm:ss"),
            // });
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
      void player.internal?.stopAsync();
    }

    return () => void player.internal?.stopAsync;
  }, [player.playing]);

  return (
    <SafeAreaView>
      <View className="flex h-screen gap-2">
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
      </View>
    </SafeAreaView>
  );
}
