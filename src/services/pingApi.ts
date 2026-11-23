import { audiobookShelfFetch } from "./audiobookShelfBaseClient";

export const pingBackend = async () => {
  try {
    await audiobookShelfFetch("/ping");
    return true;
  } catch {
    return false;
  }
};
