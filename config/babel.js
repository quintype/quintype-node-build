const { getConfig } = require("./babel.default.config");
const path = require("path");
const fs = require("fs");

let overrides = {};
// this path needs to be relative to PWD and not relative to this file.
// this file is meant to be used by the publisher apps.
if (fs.existsSync(path.resolve("./quintype-build.config.js"))) {
  overrides = require(path.resolve("./quintype-build.config.js"));
}

const babelTarget = process.env["BABEL_TARGET"] || "";
const env =
  process.env["BABEL_ENV"] || process.env["NODE_ENV"] || "development";

const defaultConfig = getConfig({ babelTarget, env });
const finalConfig = overrides.modifyBabelConfig
  ? overrides.modifyBabelConfig({ defaultConfig, babelTarget, env })
  : defaultConfig;

module.exports = finalConfig;
