import { Directory, File, Paths } from "expo-file-system";

import { db } from "@/db";
import { userSettingsSchema } from "@/db/schema";
import { getToken } from "@/stores/session-store";

export const downloadCoverArt = async (libraryItemId: string) => {
  try {
    console.log(`downloading cover art for library item: ${libraryItemId}`);
    const settings = (await db.select().from(userSettingsSchema))[0];
    const itemDirectory = new Directory(Paths.document, libraryItemId);
    if (!itemDirectory.exists) {
      itemDirectory.create({ idempotent: true, intermediates: true });
    }

    const destinationFile = new File(itemDirectory, "cover.webp");
    const result = await File.downloadFileAsync(
      `${settings.serverUrl}/api/items/${libraryItemId}/cover`,
      destinationFile,
      {
        headers: { Authorization: `Bearer ${await getToken()}` },
        idempotent: true,
      },
    );
    return result.uri;
  } catch (err) {
    console.error(
      `Exception occurred while downloading cover art for library item: ${libraryItemId}`,
      err,
    );
    throw err;
  }
};
