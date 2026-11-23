import { File, Paths } from "expo-file-system";

export const relativePathUri = (file: File) => {
  const documentDir = Paths.document;
  if (!file.uri.startsWith(documentDir.uri)) {
    throw new Error(
      `File path: ${file.uri} is not within document directory: ${documentDir.uri}`,
    );
  }
  return file.uri.substring(documentDir.uri.length);
};

export const absolutePathUri = (relativePath: string | null) => {
  if (!relativePath) {
    return "";
  }
  return new File(`${Paths.document.uri}/${relativePath}`).uri;
};
