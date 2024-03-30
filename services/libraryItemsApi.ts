import axios from "axios";

import { localDb } from "@/db";
import { userSettingsSchema } from "@/db/schema";

export const getLibraryItems = async (libraryId: string) => {
  const userSettings = (await localDb.select().from(userSettingsSchema))[0];

  try {
    console.log(`fetching library items for library with id: ${libraryId}`);
    const response = await axios.get<Root>(
      `${userSettings.serverUrl}/api/libraries/${libraryId}/items`,
      {
        headers: {
          Authorization: `Bearer ${userSettings.tokenId}`,
        },
      },
    );
    return response.data.results;
  } catch (err) {
    console.error(
      `Exception occurred while fetching items for library with id: ${libraryId}`,
      err,
    );
    throw err;
  }
};

// https://dev.to/olivermengich/file-download-in-react-native-and-expo-gk8
// export const downloadLibraryItem = async (libraryId: string) => {
//   try {
//     console.log(`downloading library item with id: ${libraryId}`);
//      axios.get(url, { responseType: "blob" }).then(res => {
//       const headerContentDisp = res.headers["content-disposition"];
//       const filename =
//         headerContentDisp &&
//         headerContentDisp.split("filename=")[1].replace(/["']/g, ""); // TODO improve parcing
//       const contentType = res.headers["content-type"];

//       const blob = new Blob([res.data], { contentType });
//       const href = window.URL.createObjectURL(blob);

//       const el = document.createElement("a");
//       el.setAttribute("href", href);
//       el.setAttribute(
//         "download",
//         filename || (config && config.filename) || "someFile"
//       );
//       el.click();

//       window.URL.revokeObjectURL(blob);
//       return res;
//     });
//   }
//   } catch (err) {
//     console.error(
//       `Exception occurred while downloading library item with id: ${libraryId}`,
//       err,
//     );
//   }
// };

export interface Root {
  results: Result[];
  total: number;
  limit: number;
  page: number;
  sortDesc: boolean;
  mediaType: string;
  minified: boolean;
  collapseseries: boolean;
  include: string;
  offset: number;
}

export interface Result {
  id: string;
  ino: string;
  oldLibraryItemId: any;
  libraryId: string;
  folderId: string;
  path: string;
  relPath: string;
  isFile: boolean;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  addedAt: number;
  updatedAt: number;
  isMissing: boolean;
  isInvalid: boolean;
  mediaType: string;
  media: Media;
  numFiles: number;
  size: number;
}

export interface Media {
  id: string;
  metadata: Metadata;
  coverPath?: string;
  tags: any[];
  numTracks: number;
  numAudioFiles: number;
  numChapters: number;
  numMissingParts: number;
  numInvalidAudioFiles: number;
  duration: number;
  size: number;
  ebookFormat?: string;
}

export interface Metadata {
  title: string;
  titleIgnorePrefix: string;
  subtitle: any;
  authorName: string;
  authorNameLF: string;
  narratorName: string;
  seriesName: string;
  genres: string[];
  publishedYear?: string;
  publishedDate: any;
  publisher?: string;
  description?: string;
  isbn?: string;
  asin: any;
  language?: string;
  explicit: boolean;
  abridged: boolean;
}
