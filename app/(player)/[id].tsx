import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";

export default function Player() {
  const { id } = useLocalSearchParams();
  const [media, setMedia] = useState<PlaylistItemType | null | undefined>(null);
  const playerState = usePlayerState();

  useEffect(() => {
    const fetchData = async () => {
      const re = await readOne(parseInt(id as string));
      if (re) {
        setMedia(re);
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: re.link },
          { shouldPlay: false },
        );
        if (status.isLoaded) {
          playerState._playbackDriver = sound;
          playerState.play();
        }
      }
    };

    void fetchData();
  }, []);
  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      {media && (
        <View className="flex h-screen gap-2 bg-slate-800 p-2">
          <TopActionsBar />
          <MediaArt />
          <MediaInfo media={media} />
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

const MediaInfo = ({ media }: { media: PlaylistItemType }) => {
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
