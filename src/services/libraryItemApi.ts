import { db } from "@/db";
import { userSettingsSchema } from "@/db/schema";
import { getToken } from "@/stores/session-store";
import { Directory, File, Paths } from "expo-file-system";
import { audiobookShelfFetch } from "./audiobookShelfBaseClient";

export const getLibraryItem = async (libraryItemId: string) => {
  try {
    console.log(`fetching library item with id: ${libraryItemId}`);
    const response = await audiobookShelfFetch<Root>(
      `/api/items/${libraryItemId}`,
    );
    return response;
    // if (!response.ok) {
    //   throw new Error(
    //     `Failed to fetch library item with id: ${libraryItemId}, status: ${response.status}`,
    //   );
    // }
    // return (await response.json()) as Root;
  } catch (err) {
    console.error(
      `Exception occurred while fetching library item with id: ${libraryItemId}`,
      err,
    );
    throw err;
  }
};

export const downloadLibraryItem = async (
  libraryItemRemoteId: string,
  fileId: string,
  filename: string,
) => {
  // try {
  //   console.log(
  //     `downloading library item: ${libraryItemId} and fileId: ${fileId}`,
  //   );
  //   const response = await axios.get(
  //     `http://192.168.68.68:13378/api/items/${libraryItemId}/file/${fileId}/download`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${audiobookshelf_token}`,
  //       },
  //       responseType: "arraybuffer",
  //     },
  //   );
  //   const filename = response.headers["content-disposition"]
  //     .split("filename=")[1]
  //     .split(".")[0];
  //   const extension = response.headers["content-disposition"]
  //     .split(".")[1]
  //     .split(";")[0];
  //   const file =
  //     FileSystem.documentDirectory + `${encodeURI(filename + "." + extension)}`;

  //   console.log({ filename, extension, file });

  //   const buffer = Buffer.from(response.data, "base64");
  //   const base64Encoded = buffer.toString("base64");
  //   await FileSystem.writeAsStringAsync(file, base64Encoded, {
  //     encoding: FileSystem.EncodingType.Base64,
  //   });
  //   // FileSystem.documentDirectory + "test.mp3";
  //   // await FileSystem.wr;
  //   console.log(`downloaded ${file}`);
  //   return file;
  // } catch (err) {
  //   console.error(
  //     `Exception occurred while downloading library item: ${libraryItemId} and fileId: ${fileId}`,
  //   );
  //   throw err;
  // }

  try {
    console.log(`downloading libraryItem remoteId: ${libraryItemRemoteId}`);
    const settings = (await db.select().from(userSettingsSchema))[0];

    const dirInfo = new Directory(Paths.document, libraryItemRemoteId);
    if (!dirInfo.exists) {
      dirInfo.create({ idempotent: true, intermediates: true });
    }

    // delete previous version of the file
    const destination = new File(dirInfo, filename);
    if (destination.exists) {
      destination.delete();
    }

    const downloadUrl = `${settings.serverUrl}/api/items/${libraryItemRemoteId}/file/${fileId}/download`;
    console.log(
      `downloading libraryItem remoteId: ${libraryItemRemoteId}, fileId: ${fileId} from url: ${downloadUrl} to destination: ${destination.uri}`,
    );
    const result = await File.downloadFileAsync(downloadUrl, destination, {
      headers: { Authorization: `Bearer ${await getToken()}` },
      idempotent: true,
    });

    return result.uri;
  } catch (err) {
    console.error(
      `Exception occurred while downloading library item remote id: ${libraryItemRemoteId}, fileId: ${fileId}, filename: ${filename}`,
      err,
    );
    throw err;
  }
};

export interface Root {
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
  lastScan: number;
  scanVersion: string;
  isMissing: boolean;
  isInvalid: boolean;
  mediaType: string;
  media: Media;
  libraryFiles: LibraryFile[];
}

export interface Media {
  id: string;
  libraryItemId: string;
  metadata: Metadata;
  coverPath: string;
  tags: any[];
  audioFiles: AudioFile[];
  chapters: Chapter[];
  missingParts: any[];
  ebookFile: EbookFile;
}

export interface Metadata {
  title: string;
  subtitle: any;
  authors: Author[];
  narrators: any[];
  series: any[];
  genres: string[];
  publishedYear: string;
  publishedDate: any;
  publisher: any;
  description: string;
  isbn: any;
  asin: any;
  language: any;
  explicit: boolean;
  abridged: boolean;
}

export interface Author {
  id: string;
  name: string;
}

export interface AudioFile {
  index: number;
  ino: string;
  metadata: Metadata2;
  addedAt: number;
  updatedAt: number;
  trackNumFromMeta: any;
  discNumFromMeta: any;
  trackNumFromFilename: number;
  discNumFromFilename: any;
  manuallyVerified: boolean;
  invalid: boolean;
  exclude: boolean;
  error: any;
  format: string;
  duration: number;
  bitRate: number;
  language: any;
  codec: string;
  timeBase: string;
  channels: number;
  channelLayout: string;
  chapters: any[];
  embeddedCoverArt: any;
  metaTags: MetaTags;
  mimeType: string;
}

export interface Metadata2 {
  filename: string;
  ext: string;
  path: string;
  relPath: string;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
}

export interface MetaTags {
  tagAlbum: string;
  tagArtist: string;
  tagGenre: string;
}

export interface Chapter {
  id: number;
  start: number;
  end: number;
  title: string;
}

export interface EbookFile {
  ino: string;
  metadata: Metadata3;
  ebookFormat: string;
  addedAt: number;
  updatedAt: number;
}

export interface Metadata3 {
  filename: string;
  ext: string;
  path: string;
  relPath: string;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
}

export interface LibraryFile {
  ino: string;
  metadata: Metadata4;
  isSupplementary?: boolean;
  addedAt: number;
  updatedAt: number;
  fileType: string;
}

export interface Metadata4 {
  filename: string;
  ext: string;
  path: string;
  relPath: string;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
}
