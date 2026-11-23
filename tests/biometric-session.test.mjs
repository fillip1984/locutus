import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function createSession({ token = "saved-token", settings } = {}) {
  let savedToken = token;
  const savedSettings = settings ?? {
    id: "settings",
    serverUrl: "https://example.invalid",
    signInWithBiometrics: true,
  };
  let state;
  const dependencies = {
    "expo-secure-store": {
      getItemAsync: async () => savedToken,
      deleteItemAsync: async () => {
        savedToken = null;
      },
    },
    "react-native-nitro-player": { TrackPlayer: { pause: async () => {} } },
    "drizzle-orm": { eq: () => {} },
    zustand: {
      create: (initialize) => {
        state = initialize(
          (update) => {
            state = { ...state, ...update };
          },
          () => state,
        );
        return { getState: () => state };
      },
    },
    "@/db": {
      db: {
        query: {
          userSettingsSchema: { findFirst: async () => savedSettings },
        },
      },
    },
    "@/db/schema": {},
    "@/services/loginApi": {
      login: () => {
        throw new Error("Biometric login must not contact the server");
      },
    },
  };
  const source = readFileSync(
    new URL("../src/stores/session-store.ts", import.meta.url),
    "utf8",
  );
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  runInNewContext(js, {
    exports,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports.useSessionStore;
}

test("successful biometric authentication unlocks the saved session offline", async () => {
  const store = createSession();
  assert.equal(await store.getState().logInWithBiometrics(true), true);
  assert.equal(store.getState().isAuthenticated, true);
  assert.equal(
    store.getState().userSettings.serverUrl,
    "https://example.invalid",
  );
});

test("failed authentication and a missing saved token cannot unlock the session", async () => {
  const store = createSession();
  assert.equal(await store.getState().logInWithBiometrics(false), false);
  assert.equal(store.getState().isAuthenticated, false);
  await store.getState().logOut();
  assert.equal(await store.getState().logInWithBiometrics(true), false);
  assert.equal(store.getState().isAuthenticated, false);
});

test("biometrics must be enabled for the saved session", async () => {
  const store = createSession({ settings: { signInWithBiometrics: false } });
  assert.equal(await store.getState().logInWithBiometrics(true), false);
  assert.equal(store.getState().isAuthenticated, false);
});
