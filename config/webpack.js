const { getConfig } = require("./webpack.default.config");
const path = require("path");
const fs = require("fs");

let overrides = {};
let publisherName = "malibu";
// this path needs to be relative to PWD and not relative to this file.
// this file is meant to be used by the publisher apps.
if (fs.existsSync(path.resolve("./quintype-build.config.js"))) {
  overrides = require(path.resolve("./quintype-build.config.js"));
}

if (fs.existsSync(path.resolve("./package.json"))) {
  publisherName = require(path.resolve("./package.json")).name;
}

const env = process.env["NODE_ENV"] || "development";

const defaultConfig = getConfig({ env, publisherName });

const finalConfig = overrides.modifyWebpackConfig
  ? overrides.modifyWebpackConfig({ defaultConfig, env })
  : defaultConfig;

module.exports = finalConfig;
