import * as FileSystem from "expo-file-system";

import { localDb } from "@/db";
import { userSettingsSchema } from "@/db/schema";

export const downloadCoverArt = async (libraryItemId: string) => {
  const userSettings = (await localDb.select().from(userSettingsSchema))[0];

  try {
    const dirInfo = await FileSystem.getInfoAsync(
      FileSystem.documentDirectory + libraryItemId,
    );
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(
        FileSystem.documentDirectory + libraryItemId,
        { intermediates: true },
      );
    }

    const result = await FileSystem.downloadAsync(
      `${userSettings.serverUrl}/api/items/${libraryItemId}/cover`,
      FileSystem.documentDirectory + libraryItemId + "/cover.webp",
      { headers: { Authorization: `Bearer ${userSettings.tokenId}` } },
    );
    return result.uri;
  } catch (err) {
    console.error(
      `Exception occurred while downloading cover art for library item: ${libraryItemId}`,
    );
    throw err;
  }
};
