const webpack = require("webpack");
const process = require("process");
const path = require("path");
const fs = require("fs");

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

exports.webpackConfig = function webpackConfig(publisherName, currentDirectory, opts = {}) {
  const PUBLIC_PATH = `/${publisherName}/assets/`;
  const OUTPUT_DIRECTORY = currentDirectory + `/public/${PUBLIC_PATH}`;

  const BABEL_PRESET = {
    loader: "babel-loader",
    options: {
      presets: ["es2015-tree-shaking", "react"]
    }
  };

  const config =
    process.env.NODE_ENV == "production"
      ? {
          outputFileName: suffix => `[name]-[hash:20].${suffix}`,
          sassLoader: ExtractTextPlugin.extract(
            "css-loader?minimize=true!sass-loader"
          ),
          cssFile: `[name]-[contenthash:20].css`,
          compressJSPlugins: opts.compressJSPlugins || [new UglifyJSPlugin()],
          outputPublicPath: PUBLIC_PATH
        }
      : {
          outputFileName: suffix => `[name].${suffix}`,
          sassLoader: "style-loader!css-loader!sass-loader",
          cssFile: `[name].css`,
          compressJSPlugins: opts.compressJSPlugins || [new webpack.NamedModulesPlugin()],
          outputPublicPath: "http://localhost:8080" + PUBLIC_PATH
        };

  const entryFiles = {
    app: "./app/client/app.js",
    serviceWorkerHelper: "./app/client/serviceWorkerHelper.sjs"
  };

  if(fs.existsSync("./app/client/polyfill.js")) {
    entryFiles["polyfill"] = "./app/client/polyfill.js";
  }

  return {
    entry: entryFiles,
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
        { test: /\.(sass|scss)$/, loader: config.sassLoader },
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
      new ExtractTextPlugin({ filename: config.cssFile, allChunks: true }),
      new ManifestPlugin({
        fileName: "../../../asset-manifest.json",
        publicPath: PUBLIC_PATH,
        writeToFileEmit: true
      })
    ].concat(config.compressJSPlugins),

    devServer: {
      headers: { "Access-Control-Allow-Origin": "*" }
    }
  };
};
