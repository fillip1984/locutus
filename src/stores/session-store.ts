import * as SecureStore from "expo-secure-store";

const key = "session_token";
export const getToken = () => {
  return (
    process.env.EXPO_PUBLIC_AUDIOBOOK_SHELF_API_KEY ||
    SecureStore.getItemAsync(key)
  );
};
export const deleteToken = () => SecureStore.deleteItemAsync(key);
export const setToken = (v: string) => SecureStore.setItem(key, v);
