import { eq } from "drizzle-orm";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { localDb } from "@/db";
import { libraryItemEBookFileSchema, libraryItemSchema } from "@/db/schema";

export default function Reader() {
  const { ebookFileId: ebookFileIdSearchParam, id: libraryItemIdSearchParam } =
    useLocalSearchParams();

  useEffect(() => {
    const ebookFileId = parseInt(ebookFileIdSearchParam as string, 10);
    const libraryItemId = parseInt(libraryItemIdSearchParam as string, 10);

    const fetchData = async () => {
      const libraryItem = await localDb.query.libraryItemSchema.findFirst({
        where: eq(libraryItemSchema.id, libraryItemId),
      });

      if (!libraryItem) {
        const msg = `Unable to find library item for id: ${libraryItemId}`;
        Toast.show({
          type: "error",
          text1: msg,
        });
        throw Error(msg);
      }
      const ebookFile =
        await localDb.query.libraryItemEBookFileSchema.findFirst({
          where: eq(libraryItemEBookFileSchema.libraryItemId, libraryItemId),
        });
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen gap-2 bg-slate-800 p-2">
        <Stack.Screen options={{ gestureDirection: "vertical" }} />
        <Text>EbookReader</Text>
        {/* <TopActionsBar /> */}
        {/* <View className="h-1/2">
          <MediaArt />
          <MediaInfo />
        </View>
        <TrackProgress />
        <MediaControls /> */}
      </View>
    </SafeAreaView>
  );
}

// const TopActionsBar = () => {
//   return (
//     <View>
//       <Link href="..">
//         {/* TODO: swipe down to dismiss, should animate down like a modal, back to where we came from, swipe left and right to go back and forward through tracks */}
//         <Ionicons name="chevron-down" size={24} color="white" />
//       </Link>
//     </View>
//   );
// };

// const MediaArt = () => {
//   const track = useActiveTrack();
//   return (
//     <View className="flex h-2/3 w-full">
//       <Image
//         source={track?.artwork}
//         style={{ flex: 1 }}
//         contentFit="cover"
//         transition={1000}
//       />
//     </View>
//   );
// };
