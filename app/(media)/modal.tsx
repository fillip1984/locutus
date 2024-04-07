import {
  FontAwesome,
  Feather,
  FontAwesome6,
  Ionicons,
} from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { useMediaStore } from "@/stores/mediaStore";

export default function MediaModal() {
  const navi = useNavigation();
  const mediaStore = useMediaStore();
  const handleDelete = () => {
    if (mediaStore.libraryItem) {
      mediaStore.deleteLibraryItem(mediaStore.libraryItem.id);
    }
  };

  const handleDownload = async () => {
    Toast.show({
      type: "info",
      text1: "Downloading audio files",
      position: "bottom",
    });
    navi.goBack();
    await mediaStore.downloadAudioFiles();
    Toast.show({
      type: "success",
      text1: "Downloaded audio files",
      position: "bottom",
    });
  };

  // TODO: figure out how to pass data to modal, maybe global search params?
  // TODO: figure out how to do a tranditional modal so we can prompt delete confirmation
  // TODO: figure out how to make this a transparent modal (see plex for example)

  return (
    <View className="flex h-screen items-center bg-slate-800 pt-10">
      <Text className="text-white">
        Options to do stuff like delete should go here
      </Text>
      <View className="flex flex-row gap-2">
        <Pressable
          onPress={handleDelete}
          className="flex min-w-[125px] items-center gap-2 rounded-lg border border-red-500 p-4">
          <Feather name="trash" size={40} color="red" />
          <Text className="text-lg text-red-500">Delete</Text>
        </Pressable>
        {/* <View className="flex h-14 w-48 flex-row items-center justify-center gap-2 rounded-lg bg-sky-300 py-2"> */}
        <Pressable
          onPress={handleDownload}
          className="flex min-w-[125px] items-center gap-2 rounded-lg border border-sky-300 p-4">
          <Ionicons
            name="cloud-download-outline"
            size={40}
            color="white"
            // style={{ color: "white" }} // TODO: figure out how to style with nativeWind
            onPress={handleDownload}
          />
          <Text className="text-lg text-sky-300">Redownload</Text>
        </Pressable>
        {/* </View> */}
      </View>
    </View>
  );
}
