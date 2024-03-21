/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: ["universe/native"],
  env: {
    node: true,
  },
};
module.exports = config;
