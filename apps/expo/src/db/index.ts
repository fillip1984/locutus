import { openDatabaseSync } from "expo-sqlite/next";
import { drizzle } from "drizzle-orm/expo-sqlite";

const expoDb = openDatabaseSync("locutus.db");

export const db = drizzle(expoDb);
