module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // See: https://dev.to/bhatvikrant/how-to-add-environment-variables-in-a-react-native-project-with-ts-2ne5
      // TODO: switch to this library if our .env file ends up getting any more complicationed: https://github.com/t3-oss/t3-env
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
        },
      ],
      ["inline-import", { extensions: [".sql"] }],
    ],
  };
};
