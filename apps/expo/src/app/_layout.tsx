import { StatusBar } from "expo-status-bar";

import { TRPCProvider } from "~/utils/api";

import "../styles.css";

import { View } from "react-native";

import type { PlaylistItemType } from "@acme/validators";

import AudioPlayer from "./_components/AudioPlayer";
import MinimizedAudioPlayer from "./_components/MinimizedAudioPlayer";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
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
  ];
  return (
    <TRPCProvider>
      {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}

      {playlist?.[0] && playlist[2] && (
        <View className="flex h-screen items-center justify-center gap-4 bg-slate-300">
          <AudioPlayer media={playlist[0]} />
          <MinimizedAudioPlayer media={playlist[2]} />
        </View>
      )}

      <StatusBar />
    </TRPCProvider>
  );
}
