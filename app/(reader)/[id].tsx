import {
  Location,
  Reader,
  Section,
  Themes,
  useReader,
} from "@epubjs-react-native/core";
import { useFileSystem } from "@epubjs-react-native/expo-file-system";
import { eq } from "drizzle-orm";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { localDb } from "@/db";
import { libraryItemEBookFileSchema, libraryItemSchema } from "@/db/schema";

export default function EBookReader() {
  const { ebookFileId: ebookFileIdSearchParam, id: libraryItemIdSearchParam } =
    useLocalSearchParams();

  const [ebookFileId, setEBookFileId] = useState<string>();
  const [initialLocation, setInitialLocation] = useState<string | undefined>();
  const [path, setPath] = useState<string | undefined | null>();
  const { toc, goNext, goPrevious, currentLocation, progress } = useReader();

  useEffect(() => {
    // TODO: build out a table of contents
    // console.log({ toc });
  }, [toc]);

  useEffect(() => {
    const ebookFileId = ebookFileIdSearchParam as string;
    const libraryItemId = libraryItemIdSearchParam as string;

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
      if (ebookFile) {
        setEBookFileId(ebookFile.id);
        setInitialLocation(ebookFile.currentLocation ?? undefined);
        setPath(ebookFile.path);
      } else {
        console.error("Unable to find ebook path");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log({ currentLocation, progress });
  }, [currentLocation, progress]);

  const updateProgress = async (
    progress: number,
    currentLocation: Location,
  ) => {
    console.log({ progress, currentLocation: currentLocation.start.cfi });
    // console.log({ currentLocation: currentLocation.start.cfi });
    if (!ebookFileId) {
      console.warn(
        "Unable to update progress due to not having an ebookFileId",
      );
      return;
    }

    await localDb
      .update(libraryItemEBookFileSchema)
      .set({
        currentLocation: currentLocation.start.cfi,
        progress: progress / 100,
        updatedAt: new Date(),
      })
      .where(eq(libraryItemEBookFileSchema.id, ebookFileId));
  };
  return (
    <SafeAreaView style={{ backgroundColor: "rgb(30 41 59)" }}>
      <View className="flex h-screen gap-2 bg-slate-800 p-2">
        <Stack.Screen options={{ gestureDirection: "vertical" }} />
        <View className="flex flex-row items-center justify-between">
          <Pressable onPress={() => goPrevious()} className="bg-sky-400 p-4">
            <Text>Previous</Text>
          </Pressable>
          <Pressable onPress={() => goNext()} className="bg-sky-400 p-4">
            <Text>Next</Text>
          </Pressable>
        </View>
        {/* See: https://github.com/victorsoares96/epubjs-react-native/blob/master/example-expo/examples/FullExample/index.tsx */}

        {path && (
          <Reader
            src={path}
            fileSystem={useFileSystem}
            height="95%"
            width="100%"
            defaultTheme={Themes.DARK}
            initialLocation={initialLocation}
            enableSwipe
            // (totalLocations: number, currentLocation: Location, progress: number, currentSection: Section | null)
            onLocationChange={(
              totalLocations: number,
              currentLocation: Location,
              progress: number,
              currentSection: Section | null,
            ) => updateProgress(progress, currentLocation)}
          />
        )}
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
