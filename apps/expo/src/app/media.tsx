import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Media() {
  return (
    <SafeAreaView>
      <View>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </Pressable>
        <Text>Hello media</Text>
      </View>
    </SafeAreaView>
  );
}
