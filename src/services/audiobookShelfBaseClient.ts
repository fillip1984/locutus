import { db } from "@/db";
import { userSettingsSchema } from "@/db/schema";
import { getToken } from "@/stores/session-store";
import typedFetch from "./typedFetch";

const serverUrl = async () => {
  const settings = await db.select().from(userSettingsSchema);
  if (!settings || settings.length === 0) {
    throw Error(
      "Unable to init audiobookShelf bases client, serverUrl is not found in user preferences",
    );
  }
  return settings[0].serverUrl;
};

export const audiobookShelfFetch = async <T>(
  endpoint: string,
  options: RequestInit = {},
) => {
  const server = await serverUrl();
  const token = await getToken();
  const effectiveUrl = `${server}${endpoint}`;
  console.log(`Making request to ${effectiveUrl}`);
  return typedFetch<T>(effectiveUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
};
