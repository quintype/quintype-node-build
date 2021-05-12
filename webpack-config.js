const webpack = require("webpack");
const process = require("process");
const fs = require("fs");
const path = require("path");

const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");

exports.webpackConfig = function webpackConfig(
  publisherName,
  currentDirectory,
  opts = {}
) {
  const PUBLIC_PATH = `/${publisherName}/assets/`;
  const OUTPUT_DIRECTORY = currentDirectory + `/public/${PUBLIC_PATH}`;

  const BABEL_PRESET = {
    loader: "babel-loader",
    options: {
      // this is to ensure any existing babelrc configs in any file relative paths are ignored
      babelrc: false,
      // this path needs to be relative to this file and not PWD
      configFile: path.resolve(__dirname, "./config/babel.js")
    }
  };

  const config =
    process.env.NODE_ENV === "production"
      ? {
          outputFileName: suffix => `[name]-[hash:20].${suffix}`,
          sassLoader: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader"
            },
            {
              loader: "sass-loader"
            }
          ],
          cssModuleLoader: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: "[name]__[local]__[hash:base64:5]"
              }
            },
            {
              loader: "postcss-loader",
              options: {
                ident: "postcss",
                sourceMap: true,
                plugins: loader => [
                  require("precss")(),
                  require("autoprefixer")
                ]
              }
            }
          ],
          cssFile: `[name]-[contenthash:20].css`,
          compressCSSPlugins: [
            new OptimizeCssAssetsPlugin({
              cssProcessorOptions: { safe: true }
            })
          ],
          outputPublicPath: PUBLIC_PATH,
          sourceMapType: "source-map"
        }
      : {
          outputFileName: suffix => `[name].${suffix}`,
          sassLoader: [
            { loader: "style-loader" },
            { loader: "css-loader", options: { sourceMap: true } },
            { loader: "sass-loader", options: { sourceMap: true } }
          ],
          cssModuleLoader: [
            { loader: "style-loader" },
            {
              loader: "css-loader",
              options: {
                sourceMap: true,
                modules: true,
                importLoaders: 1,
                localIdentName: "[name]__[local]__[hash:base64:5]"
              }
            },
            {
              loader: "postcss-loader",
              options: {
                ident: "postcss",
                sourceMap: true,
                plugins: loader => [
                  require("precss")(),
                  require("autoprefixer")
                ]
              }
            }
          ],
          cssFile: `[name].css`,
          compressCSSPlugins: [],
          outputPublicPath: "http://localhost:8080" + PUBLIC_PATH,
          sourceMapType: "eval-source-map"
        };

  const entryFiles = Object.assign(
    {
      app: "./app/client/app.js",
      serviceWorkerHelper: "./app/client/serviceWorkerHelper.sjs"
    },
    opts.entryFiles
  );

  if (fs.existsSync("./app/client/polyfill.js")) {
    entryFiles["polyfill"] = "./app/client/polyfill.js";
  }

  return {
    entry: entryFiles,
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    output: {
      path: OUTPUT_DIRECTORY,
      filename: config.outputFileName("js"),
      publicPath: config.outputPublicPath
    },
    module: {
      rules: [
        { test: /\.jsx?$/, exclude: /node_modules/, use: BABEL_PRESET },
        {
          test: /\.jsx?$/,
          include: /node_modules\/@quintype\/framework/,
          use: BABEL_PRESET
        },
        {
          test: /\.jsx?$/,
          include: /node_modules\/@quintype\/components\/store/,
          use: BABEL_PRESET
        },
        { test: /\.(sass|scss)$/, use: config.sassLoader },
        { test: /\.module.css$/, use: config.cssModuleLoader },
        { test: /\.m.css$/, use: config.cssModuleLoader },
        {
          test: /\.(jpe?g|gif|png|svg|woff|woff2|eot|ttf|wav|mp3|ico|mp4)$/,
          loader: "file-loader",
          options: {
            context: "./app/assets",
            name: config.outputFileName("[ext]"),
            esModule: false
          }
        }
      ]
    },
    plugins: [
      new webpack.EnvironmentPlugin({ NODE_ENV: "development" }),
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
      })
    ].concat(config.compressCSSPlugins),

    devServer: {
      headers: { "Access-Control-Allow-Origin": "*" }
    },
    devtool: config.sourceMapType
  };
};
