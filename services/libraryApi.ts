import axios from "axios";
import Toast from "react-native-toast-message";

import { localDb } from "@/db";
import { userSettingsSchema } from "@/db/schema";

export const getLibraries = async () => {
  const userSettings = (await localDb.select().from(userSettingsSchema))[0];

  try {
    // console.log("fetching libraries");
    const response = await axios.get<Root>(
      `${userSettings.serverUrl}/api/libraries`,
      {
        headers: {
          Authorization: `Bearer ${userSettings.tokenId}`,
        },
      },
    );
    return response.data.libraries;
  } catch (err) {
    console.error("Exception occurred while fetching libraries", err);
    Toast.show({
      position: "bottom",
      type: "error",
      text1: "Error while attempting to connect to server",
    });
    throw err;
  }
};

export interface Root {
  libraries: Library[];
}

export interface Library {
  id: string;
  oldLibraryId: any;
  name: string;
  folders: Folder[];
  displayOrder: number;
  icon: string;
  mediaType: string;
  provider: string;
  settings: Settings;
  lastScan: number;
  lastScanVersion: string;
  createdAt: number;
  lastUpdate: number;
}

export interface Folder {
  id: string;
  fullPath: string;
  libraryId: string;
  addedAt: number;
}

export interface Settings {
  coverAspectRatio: number;
  disableWatcher: boolean;
  skipMatchingMediaWithAsin: boolean;
  skipMatchingMediaWithIsbn: boolean;
  autoScanCronExpression: any;
  audiobooksOnly: boolean;
  hideSingleBookSeries: boolean;
  onlyShowLaterBooksInContinueSeries: boolean;
  metadataPrecedence: string[];
  podcastSearchRegion: string;
}
