const webpack = require("webpack");
const fs = require("fs");
const path = require("path");
const genericNames = require('generic-names');
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const { getCssClassNames } = require("./utils");

const LodashModuleReplacementPlugin = require("lodash-webpack-plugin");

const generate = genericNames(getCssClassNames(), {
  context: process.cwd()
});

const generateScopedName = (localName, filePath) => {
  const relativePath = path.relative(process.cwd(), filePath);
  return generate(localName, relativePath);
};

function getCssModuleConfig({ env = "development" }) {
  const extractLoader =  MiniCssExtractPlugin.loader;
  const cssLoader = {
    loader: "css-loader",
    options: {
      sourceMap: true,
      modules: {
        getLocalIdent: (context, localIdentName, localName) => {
          return generateScopedName(localName, context.resourcePath)
        }
      },
      importLoaders: 1
    }
  };
  const preProcessCssLoader = {
    loader: "postcss-loader",
    options: {
      sourceMap: true,
      postcssOptions: (loaderContext) => {
        return {
          plugins: [require("precss")(), require("autoprefixer")]
        }
      },
    },
  }
  return [extractLoader, cssLoader, preProcessCssLoader];
}

function getSassConfig({ env = "development" }) {
  return [
    MiniCssExtractPlugin.loader,
    { loader: "css-loader", options: { sourceMap: true } },
    { loader: "sass-loader", options: { sourceMap: true } }
  ];
}

function getBabelConfig() {
  return [
    {
      loader: "babel-loader",
      options: {
        // this is to ensure any existing babelrc configs in any file relative paths are ignored
        babelrc: false,
        plugins: ["lodash"],
        // this path needs to be relative to this file and not PWD
        configFile: path.resolve(__dirname, "./babel.js"),
        sourceType: "unambiguous"
      }
    }
  ];
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
    opts.entryFiles,
    opts.loadableConfig && opts.loadableConfig.entryFiles
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
  const includeLoadablePlugin = () => {
    if (opts.loadableConfig && Object.keys(opts.loadableConfig).length > 0) {
      const LoadablePlugin = require("@loadable/webpack-plugin");
      const loadablePluginInit = new LoadablePlugin({
        writeToDisk: true,
        filename: path.resolve("stats.json")
      });
      return [loadablePluginInit];
    }
    return [];
  };
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
          test: /\.arrow.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                sourceMap: true
              }
            }
          ]
        },
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
      new LodashModuleReplacementPlugin({
        paths: true
      }),
      new MiniCssExtractPlugin(),
      new webpack.EnvironmentPlugin({ NODE_ENV: "development" }),
      new WebpackManifestPlugin({
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
      }),
      ...includeLoadablePlugin()
    ].concat(config.compressCSSPlugins),
    devServer: {
      headers: { "Access-Control-Allow-Origin": "*" },
      hot: opts.env !== "production"
    },
    devtool: config.sourceMapType
  };
}

module.exports = { getConfig };
