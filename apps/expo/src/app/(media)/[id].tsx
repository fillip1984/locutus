import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";

import type { PlaylistItemType } from "@acme/validators";

import { readOne } from "~/store/mediaStore";

export default function Media() {
  const { id } = useLocalSearchParams();
  const [media, setMedia] = useState<PlaylistItemType | null | undefined>(null);

  useEffect(() => {
    const fetchData = async () => {
      const re = await readOne(parseInt(id as string));
      setMedia(re);
    };

    void fetchData();
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      {media && (
        <View className="flex h-screen gap-2 bg-slate-800 p-2">
          <TopActionsBar />
          <MediaArtAndImportantInfo media={media} />
          <MediaActionsBar />
          <MediaSummary />
          <MediaTracks />
        </View>
      )}
    </SafeAreaView>
  );
}

const TopActionsBar = () => {
  return (
    <View>
      <Pressable onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="white" />
      </Pressable>
    </View>
  );
};

// cloned from flex page shown after selecting a movie
const MediaArtAndImportantInfo = ({ media }: { media: PlaylistItemType }) => {
  return (
    <View className="flex flex-row gap-2">
      <View className="flex h-48 w-48 items-center justify-center rounded-lg bg-stone-400">
        <Text>ABC</Text>
      </View>
      <View className="flex justify-end">
        {/* TODO: figure out how to wrap text, usual tricks ain't working */}
        <Text className="text-lg font-bold text-white">{media.title}</Text>
        <Text className="text-lg text-stone-400">2024 * 1hr 25m * TV-PG</Text>
        <Text className="text-stone-400">GoodReads rating</Text>
      </View>
    </View>
  );
};

const MediaActionsBar = () => {
  return (
    <View className="flex flex-row items-center justify-between">
      {/* main button */}
      {/* TODO: Looks like Plex is using css grid to have 4 squares, the first col taking up a little over 1/3. This causes the art poster and play button to align */}
      <Pressable className="flex w-48 flex-row items-center justify-center gap-2 rounded-lg bg-sky-300 py-2">
        <Ionicons name="play-sharp" size={40} color="white" />
        <Text className="text-2xl font-bold text-white">Play</Text>
      </Pressable>
      {/* other menu items */}
      <View className="mr-2 flex flex-row items-center gap-4">
        <Ionicons name="cloud-download-outline" size={24} color="white" />
        {/* TODO: add actions that make sense, like add to reading queue/bookmark, download, mark as read */}
        {/* TODO: need to work out sheet that slides up to reveal options */}
        <FontAwesome6 name="ellipsis" size={24} color="white" />
      </View>
    </View>
  );
};

const MediaSummary = () => {
  return (
    <View className="mt-4">
      <Text className="text-stone-300">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quae laborum
        temporibus culpa laudantium eligendi placeat qui sapiente corrupti
        labore ipsum, reiciendis autem eos! Voluptate esse quisquam ea nihil
        perspiciatis ab voluptatibus delectus, repellat eos harum ad labore
        rerum quod perferendis adipisci. Sint, nesciunt, veniam natus sapiente
        reiciendis eligendi nemo dolorem ratione consequuntur obcaecati labore
        aperiam optio neque hic libero modi voluptate quo accusamus tempora vero
        temporibus iure pariatur!
      </Text>

      {/* TODO: looks like more CSS GRID would be a better fit here as well */}
      <View className="mt-4">
        <View className="flex flex-row items-center gap-4">
          <Text className="uppercase text-stone-400">AUTHOR</Text>
          <Text className="text-stone-300">Ray Charles</Text>
        </View>
        <View className="flex flex-row items-center gap-4">
          <Text className="uppercase text-stone-400">PUBLISHED</Text>
          <Text className="text-stone-300">December 25, 2022</Text>
        </View>
      </View>
    </View>
  );
};

const MediaTracks = () => {
  return (
    <View className="mt-4">
      <View className="flex flex-row justify-between">
        <Text className="uppercase text-white">Chapters</Text>
        <Text className="text-stone-300">10 unwatched</Text>
      </View>

      <View className="my-2 flex gap-1">
        <View className="flex flex-row justify-between rounded bg-slate-400/30 p-4">
          <Text className="text-white">1 - Something</Text>
          <Text className="text-white">43:12</Text>
          <FontAwesome6 name="circle-play" size={24} color="white" />
        </View>
        <View className="flex flex-row justify-between rounded bg-slate-400/30 p-4">
          <Text className="text-white">2 - Something else</Text>
          <Text className="text-white">42:11</Text>
          <FontAwesome6 name="circle-play" size={24} color="white" />
        </View>
      </View>
    </View>
  );
};
