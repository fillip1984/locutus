import { TrackPlayer } from "react-native-nitro-player";
import * as SecureStore from "expo-secure-store";

import { eq } from "drizzle-orm";
import { create } from "zustand";

import { db } from "@/db";
import { userSettingsSchema, UserSettingsSchemaType } from "@/db/schema";
import { login } from "@/services/loginApi";

const key = "session_token";
// Token is exposed this way, and not using the store, since you can't use hooks inside of non-tsx files
export const getToken = () => {
  return SecureStore.getItemAsync(key);
};

export interface SessionStore {
  isAuthenticated: boolean;
  userSettings: UserSettingsSchemaType | null;
  logIn: (
    serverUrl: string,
    username: string,
    password: string,
  ) => Promise<boolean>;
  logInWithBiometrics: (biometricsResult: boolean) => Promise<boolean>;
  logOut: () => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  isAuthenticated: false,
  userSettings: null,
  logIn: async (serverUrl: string, username: string, password: string) => {
    console.log("Logging in...", serverUrl, username);
    const token = await login(serverUrl, username, password);
    if (token) {
      let existingSettings = await db.query.userSettingsSchema.findFirst();
      if (existingSettings) {
        const result = await db
          .update(userSettingsSchema)
          .set({
            serverUrl,
            signInWithBiometrics: true,
          })
          .where(eq(userSettingsSchema.id, existingSettings.id))
          .returning();
        existingSettings = result[0];
      } else {
        // TODO: assuming biometrics are desired
        const results = await db
          .insert(userSettingsSchema)
          .values({
            serverUrl,
            signInWithBiometrics: true,
          })
          .returning();
        existingSettings = results[0];
      }
      await SecureStore.setItemAsync(key, token);
      set({ userSettings: existingSettings, isAuthenticated: true });
      return true;
    } else {
      return false;
    }
  },
  logInWithBiometrics: async (biometricsResult: boolean) => {
    if (biometricsResult) {
      const result = await db.query.userSettingsSchema.findFirst();
      set({ isAuthenticated: true, userSettings: result });
      return true;
    } else {
      return false;
    }
  },
  logOut: async () => {
    TrackPlayer.pause();
    set({ isAuthenticated: false, userSettings: null });
  },
}));
