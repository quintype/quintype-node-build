const webpack = require("webpack");
const process = require("process");
const path = require("path");
const fs = require("fs");

const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");

exports.webpackConfig = function webpackConfig(publisherName, currentDirectory, opts = {}) {
  const PUBLIC_PATH = `/${publisherName}/assets/`;
  const OUTPUT_DIRECTORY = currentDirectory + `/public/${PUBLIC_PATH}`;

  const BABEL_PRESET = {
    loader: "babel-loader",
    options: {
      presets: ["es2015-tree-shaking", "react"],
      plugins: [
        ["react-css-modules", {
          webpackHotModuleReloading: process.env.NODE_ENV != "production",
          generateScopedName: "[name]__[local]__[hash:base64:5]"
        }]
      ],
    }
  };

  const config =
    process.env.NODE_ENV == "production"
      ? {
        outputFileName: suffix => `[name]-[hash:20].${suffix}`,
        cssModuleLoader: [MiniCssExtractPlugin.loader, {
          loader: "css-loader", options: { modules: true, importLoaders: 1, localIdentName: "[name]__[local]__[hash:base64:5]" },
        }, {
          loader: "postcss-loader",
          options: {
            ident: "postcss",
            sourceMap: true,
            plugins: (loader) => [
              require("autoprefixer"),
              require("precss")()
            ]
          }
        }, { loader: "sass-loader" }, {
          loader: "sass-resources-loader",
          options: {
            resources: "./app/assets/stylesheets/base/tools/mixins.scss"
          }
        }],
        cssFile: `[name]-[contenthash:20].css`,
        compressCSSPlugins: [new OptimizeCssAssetsPlugin({
          cssProcessorOptions: { safe: true }
        })],
        outputPublicPath: PUBLIC_PATH,
        sourceMapType: 'source-map'
      }
      : {
        outputFileName: suffix => `[name].${suffix}`,
        cssModuleLoader: [
          { loader: "style-loader" },
          { loader: "css-loader", options: { sourceMap: true, modules: true, importLoaders: 1, localIdentName: "[name]__[local]__[hash:base64:5]" } },
          {
            loader: "postcss-loader",
            options: {
              ident: "postcss",
              sourceMap: true,
              plugins: (loader) => [
                require("autoprefixer"),
                require("precss")()
              ]
            }
          }, { loader: "sass-loader" }, {
            loader: "sass-resources-loader",
            options: {
              resources: "./app/assets/stylesheets/base/tools/mixins.scss"
            }
          }
        ],
        cssFile: `[name].css`,
        compressCSSPlugins: [],
        outputPublicPath: "http://localhost:8080" + PUBLIC_PATH,
        sourceMapType: 'eval-source-map'
      };

  const entryFiles = Object.assign({
    app: "./app/client/app.js",
    serviceWorkerHelper: "./app/client/serviceWorkerHelper.sjs"
  }, opts.entryFiles);

  if (fs.existsSync("./app/client/polyfill.js")) {
    entryFiles["polyfill"] = "./app/client/polyfill.js";
  }

  return {
    entry: entryFiles,
    mode: process.env.NODE_ENV == 'production' ? 'production' : 'development',
    output: {
      path: OUTPUT_DIRECTORY,
      filename: config.outputFileName("js"),
      publicPath: config.outputPublicPath
    },
    module: {
      rules: [
        { test: /\.jsx?$/, exclude: /node_modules/, use: BABEL_PRESET },
        { test: /\.jsx?$/, include: /node_modules\/@quintype\/framework/, use: BABEL_PRESET },
        { test: /\.jsx?$/, include: /node_modules\/@quintype\/components\/store/, use: BABEL_PRESET },
        { test: /\.(sass|scss)$/, use: config.cssModuleLoader },
        { test: /\.module.css$/, use: config.cssModuleLoader },
        { test: /\.m.scss$/, use: config.cssModuleLoader },
        { test: /\.m.css$/, use: config.cssModuleLoader },
        {
          test: /\.(jpe?g|gif|png|svg|woff|woff2|eot|ttf|wav|mp3|ico|mp4)$/,
          loader: "file-loader",
          query: {
            context: "./app/assets",
            name: config.outputFileName("[ext]")
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
            path: asset.path.replace(config.outputPublicPath, PUBLIC_PATH),
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
