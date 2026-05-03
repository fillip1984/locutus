import { Directory, File, Paths } from "expo-file-system";

import { db } from "@/db";
import { userSettingsSchema } from "@/db/schema";
import { getToken } from "@/stores/session-store";
import { relativePathUri } from "@/utils/file-utils";
import { audiobookShelfFetch } from "./audiobookShelfBaseClient";

export const getLibraryItem = async (libraryItemId: string) => {
  try {
    console.log(`fetching library item with id: ${libraryItemId}`);
    const response = await audiobookShelfFetch<Root>(
      `/api/items/${libraryItemId}`,
    );
    return response;
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

    return relativePathUri(result);
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
