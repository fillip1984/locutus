import { audiobookShelfFetch } from "./audiobookShelfBaseClient";

export const pingBackend = async () => {
  try {
    return (await audiobookShelfFetch("/ping")) !== undefined;
  } catch {
    return false;
  }
};
