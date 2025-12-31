import { File, Directory, Paths } from "expo-file-system";

import { localDb } from "@/db";
import { userSettingsSchema } from "@/db/schema";
import { getToken } from "@/stores/sessionStore";

export const downloadCoverArt = async (libraryItemId: string) => {
  const userSettings = (await localDb.select().from(userSettingsSchema))[0];

  try {
    const dirInfo = new Directory(Paths.document, libraryItemId);
    if (!dirInfo.exists) {
      dirInfo.create();
    }

    const result = await File.downloadFileAsync(
      `${userSettings.serverUrl}/api/items/${libraryItemId}/cover`,
      new File(dirInfo, "cover.webp"),
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    return result.uri;
  } catch (err) {
    console.error(
      `Exception occurred while downloading cover art for library item: ${libraryItemId}`,
    );
    throw err;
  }
};
