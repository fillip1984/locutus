/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */

/** @type { PrettierConfig | TailwindConfig } */
const config = {
    plugins: [
        "prettier-plugin-tailwindcss",
    ],
    bracketSameLine: true
};

module.exports = config;