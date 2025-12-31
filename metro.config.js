const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("sql");

module.exports = withNativeWind(config, {
  input: "./src/styles/global.css",
  // TODO: figure out if dirname and inlineRem are necessary
  // configPath: "./tailwind.config.ts",
  // __dirname,
  // inlineRem: false,
});
