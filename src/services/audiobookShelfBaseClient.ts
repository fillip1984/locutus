import { toast } from "sonner-native";

import { db } from "@/db";
import { getToken } from "@/stores/session-store";
import typedFetch from "./typedFetch";

export const audiobookShelfFetch = async <T>(
  endpoint: string,
  options: RequestInit = {},
) => {
  const settings = await db.query.userSettingsSchema.findFirst();
  if (!settings) {
    toast.error(
      "Unable to find server url in user preferences, please log in again",
    );
    return undefined;
  }
  const server = settings.serverUrl;
  const token = await getToken();
  if (!token) {
    toast.error("Unable to find authentication token, please log in again");
    return undefined;
  }
  const effectiveUrl = `${server}${endpoint}`;
  // console.log(`Making request to ${effectiveUrl}`);
  return typedFetch<T>(effectiveUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
};
