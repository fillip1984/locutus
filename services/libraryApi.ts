import { audiobookshelf_token } from "@env";
import axios from "axios";

export const getLibraries = async () => {
  try {
    console.log("fetching libraries");
    const response = await axios.get<Root>(
      "http://192.168.68.68:13378/api/libraries",
      {
        headers: {
          Authorization: `Bearer ${audiobookshelf_token}`,
        },
      },
    );
    return response.data.libraries;
  } catch (err) {
    console.error("Exception occurred while fetching libraries", err);
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
