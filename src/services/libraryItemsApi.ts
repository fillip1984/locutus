import { audiobookShelfFetch } from "./audiobookShelfBaseClient";

export const getLibraryItems = async (libraryId: string) => {
  try {
    // console.log(`fetching library items for library with id: ${libraryId}`);
    const response = await audiobookShelfFetch<Root>(
      `/api/libraries/${libraryId}/items`,
    );

    // if (!response.ok) {
    //   throw new Error(
    //     `Failed to fetch library items for library with id: ${libraryId}, status: ${response.status}`,
    //   );
    // }
    return response?.results;
  } catch (err) {
    console.error(
      `Exception occurred while fetching items for library with id: ${libraryId}`,
      err,
    );
    throw err;
  }
};

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
