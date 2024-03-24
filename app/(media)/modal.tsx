import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function modal() {
  // const handleDelete = () => {
  //   del(media.id);
  // };

  // TODO: figure out how to pass data to modal, maybe global search params?
  // TODO: figure out how to do a tranditional modal so we can prompt delete confirmation
  // TODO: figure out how to make this a transparent modal (see plex for example)

  return (
    <View className="flex h-screen items-center justify-center bg-slate-800">
      <Text className="text-white">
        Options to do stuff like delete should go here
      </Text>
      <View>
        <Pressable className="flex items-center gap-2 rounded-lg border border-red-500 p-4">
          <Feather name="trash" size={40} color="red" />
          <Text className="text-lg text-red-500">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
