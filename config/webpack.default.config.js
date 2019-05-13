const webpack = require("webpack");
const fs = require("fs");
const path = require("path");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const SVGSpritemapPlugin = require("svg-spritemap-webpack-plugin");

const LodashModuleReplacementPlugin = require("lodash-webpack-plugin");

function getCssModuleConfig({ env = "development" }) {
  const extractLoader =
    env === "production"
      ? MiniCssExtractPlugin.loader
      : { loader: "style-loader" };
  const cssLoader = {
    loader: "css-loader",
    options: {
      sourceMap: true,
      modules: true,
      importLoaders: 1,
      localIdentName: "[name]__[local]__[hash:base64:5]"
    }
  };
  const preProcessCssLoader = {
    loader: "postcss-loader",
    options: {
      ident: "postcss",
      sourceMap: true,
      plugins: loader => [require("precss")(), require("autoprefixer")]
    }
  };
  return [extractLoader, cssLoader, preProcessCssLoader];
}

function getSassConfig({ env = "development" }) {
  return [
    env === "production"
      ? MiniCssExtractPlugin.loader
      : { loader: "style-loader" },
    { loader: "css-loader", options: { sourceMap: true } },
    { loader: "sass-loader", options: { sourceMap: true } }
  ];
}

function getBabelConfig() {
  return {
    loader: "babel-loader",
    options: {
      // this is to ensure any existing babelrc configs in any file relative paths are ignored
      babelrc: false,
      plugins: ["lodash"],
      // this path needs to be relative to this file and not PWD
      configFile: path.resolve(__dirname, "./babel.js"),
      sourceType: "unambiguous"
    }
  };
}

function entryFiles(opts) {
  let entryFiles = {};

  if (fs.existsSync("./app/client/polyfill.js")) {
    entryFiles["polyfill"] = "./app/client/polyfill.js";
  }

  entryFiles = Object.assign(
    {},
    entryFiles,
    {
      app: "./app/client/app.js",
      serviceWorkerHelper: "./app/client/serviceWorkerHelper.sjs"
    },
    opts.entryFiles
  );

  return entryFiles;
}

function getProductionConfig(opts) {
  const sassConfig = getSassConfig({ ...opts, env: "production" });
  const cssModuleConfig = getCssModuleConfig({ ...opts, env: "production" });
  const PUBLIC_PATH = `/${opts.publisherName}/assets/`;
  return {
    outputFileName: suffix => `[name]-[hash:20].${suffix}`,
    sassConfig,
    cssModuleConfig,
    cssFile: `[name]-[contenthash:20].css`,
    compressCSSPlugins: [new OptimizeCssAssetsPlugin()],
    outputPublicPath: PUBLIC_PATH,
    sourceMapType: "source-map"
  };
}

function getDevelopmentConfig(opts) {
  const sassConfig = getSassConfig({ ...opts, env: "development" });
  const cssModuleConfig = getCssModuleConfig({ ...opts, env: "development" });
  const PUBLIC_PATH = `/${opts.publisherName}/assets/`;
  return {
    outputFileName: suffix => `[name].${suffix}`,
    sassConfig,
    cssModuleConfig,
    cssFile: `[name].css`,
    compressCSSPlugins: [],
    outputPublicPath: "http://localhost:8080" + PUBLIC_PATH,
    sourceMapType: "eval-source-map"
  };
}

function getConfig(opts) {
  const PUBLIC_PATH = `/${opts.publisherName}/assets/`;
  const OUTPUT_DIRECTORY = path.resolve(`./public/${PUBLIC_PATH}`);
  const config =
    opts.env === "production"
      ? getProductionConfig(opts)
      : getDevelopmentConfig(opts);
  return {
    entry: entryFiles(opts),
    mode: opts.env === "production" ? "production" : "development",
    output: {
      path: OUTPUT_DIRECTORY,
      filename: config.outputFileName("js"),
      publicPath: config.outputPublicPath
    },
    module: {
      rules: [
        { test: /\.jsx?$/, exclude: /node_modules/, use: getBabelConfig(opts) },
        {
          test: /\.jsx?$/,
          include: /node_modules\/@quintype\/framework/,
          use: getBabelConfig(opts)
        },
        {
          test: /\.jsx?$/,
          include: /node_modules\/@quintype\/components\/store/,
          use: getBabelConfig(opts)
        },
        { test: /\.(sass|scss)$/, use: config.sassConfig },
        { test: /\.module.css$/, use: config.cssModuleConfig },
        { test: /\.m.css$/, use: config.cssModuleConfig },
        {
          test: /\.(jpe?g|gif|png|woff|woff2|eot|ttf|wav|mp3|ico|mp4)$/,
          loader: "file-loader",
          query: {
            context: "./app/assets",
            name: config.outputFileName("[ext]")
          }
        }
      ]
    },

    plugins: [
      new LodashModuleReplacementPlugin({
        paths: true
      }),
      new webpack.EnvironmentPlugin({ NODE_ENV: "development" }),
      new SVGSpritemapPlugin("./app/assets/**/*.svg"),
      new MiniCssExtractPlugin({ filename: config.cssFile }),
      new ManifestPlugin({
        map(asset) {
          return Object.assign(asset, {
            path: asset.path.replace(config.outputPublicPath, PUBLIC_PATH)
          });
        },
        fileName: "../../../asset-manifest.json",
        publicPath: PUBLIC_PATH,
        writeToFileEmit: true
      }),
      new DuplicatePackageCheckerPlugin({
        verbose: true
      })
    ].concat(config.compressCSSPlugins),

    devServer: {
      headers: { "Access-Control-Allow-Origin": "*" }
    },
    devtool: config.sourceMapType
  };
}

module.exports = { getConfig };
