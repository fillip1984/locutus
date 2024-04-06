import axios from "axios";
import Toast from "react-native-toast-message";

export const login = async (
  url: string,
  username: string,
  password: string,
) => {
  try {
    // console.log("logging in");
    const response = await axios.post<Root>(`${url}/login`, {
      username,
      password,
    });
    return response.data;
  } catch (err) {
    console.error("Exception occurred while fetching libraries", err);
    Toast.show({
      position: "bottom",
      type: "error",
      text1: "Error while attempting to login",
    });
    throw err;
  }
};

export interface Root {
  user: User;
  userDefaultLibraryId: string;
  serverSettings: ServerSettings;
  ereaderDevices: any[];
  Source: string;
}

export interface User {
  id: string;
  oldUserId: any;
  username: string;
  email: any;
  type: string;
  token: string;
  mediaProgress: MediaProgress[];
  seriesHideFromContinueListening: any[];
  bookmarks: any[];
  isActive: boolean;
  isLocked: boolean;
  lastSeen: number;
  createdAt: number;
  permissions: Permissions;
  librariesAccessible: any[];
  itemTagsSelected: any[];
  hasOpenIDLink: boolean;
}

export interface MediaProgress {
  id: string;
  userId: string;
  libraryItemId: string;
  episodeId: any;
  mediaItemId: string;
  mediaItemType: string;
  duration: number;
  progress: number;
  currentTime: number;
  isFinished: boolean;
  hideFromContinueListening: boolean;
  ebookLocation: string;
  ebookProgress: any;
  lastUpdate: number;
  startedAt: number;
  finishedAt: any;
}

export interface Permissions {
  download: boolean;
  update: boolean;
  delete: boolean;
  upload: boolean;
  accessAllLibraries: boolean;
  accessAllTags: boolean;
  accessExplicitContent: boolean;
}

export interface ServerSettings {
  id: string;
  scannerFindCovers: boolean;
  scannerCoverProvider: string;
  scannerParseSubtitle: boolean;
  scannerPreferMatchedMetadata: boolean;
  scannerDisableWatcher: boolean;
  storeCoverWithItem: boolean;
  storeMetadataWithItem: boolean;
  metadataFileFormat: string;
  rateLimitLoginRequests: number;
  rateLimitLoginWindow: number;
  backupSchedule: boolean;
  backupsToKeep: number;
  maxBackupSize: number;
  loggerDailyLogsToKeep: number;
  loggerScannerLogsToKeep: number;
  homeBookshelfView: number;
  bookshelfView: number;
  podcastEpisodeSchedule: string;
  sortingIgnorePrefix: boolean;
  sortingPrefixes: string[];
  chromecastEnabled: boolean;
  dateFormat: string;
  timeFormat: string;
  language: string;
  logLevel: number;
  version: string;
  buildNumber: number;
  authLoginCustomMessage: any;
  authActiveAuthMethods: string[];
  authOpenIDIssuerURL: any;
  authOpenIDAuthorizationURL: any;
  authOpenIDTokenURL: any;
  authOpenIDUserInfoURL: any;
  authOpenIDJwksURL: any;
  authOpenIDLogoutURL: any;
  authOpenIDButtonText: string;
  authOpenIDAutoLaunch: boolean;
  authOpenIDAutoRegister: boolean;
  authOpenIDMatchExistingBy: any;
}
