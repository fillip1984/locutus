import axios from "axios";

import { localDb } from "@/db";
import { getToken } from "@/stores/sessionStore";

const serverUrl = async () => {
  const userSettings = await localDb.query.userSettingsSchema.findFirst();
  if (!userSettings) {
    throw Error(
      "Unable to init axios client, serverUrl is not found in user preferences",
    );
  }
  return userSettings.serverUrl;
};

export const getAxiosClient = async () => {
  const server = await serverUrl();
  const axiosClient = axios.create({
    baseURL: server,
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  axiosClient.interceptors.request.use((request) => {
    console.log({ d: request.data });
    return request;
  });
  return axiosClient;
};
