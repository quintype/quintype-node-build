const createGenerator = require("generic-names");
const { getCssClassNames } = require("./utils");

const reactCssPluginOptions = {
  generateScopedName: createGenerator(getCssClassNames()),
  autoResolveMultipleImports: true,
};

const commonPresets = ["@babel/preset-react"];

const commonPlugins = ["@babel/plugin-proposal-class-properties", "@babel/plugin-proposal-object-rest-spread"];

const getLoadablePlugin = (loadableConfig) =>
  loadableConfig && Object.keys(loadableConfig).length > 0 ? ["@loadable/babel-plugin"] : [];

function getConfig(opts) {
  const loadableBabelPlugin = getLoadablePlugin((opts.loadableConfig = {}));
  switch (opts.babelTarget) {
    case "node":
      return getNodeConfig(opts, loadableBabelPlugin);
    case "browser":
      return getBrowserConfig(opts, loadableBabelPlugin);
    default:
      console.warn("Babel Target not specified defaulting to `browser`");
      return getBrowserConfig(opts, loadableBabelPlugin);
  }
}

function getRemainingConfig() {
  // this is to ensure any existing babelrc configs in any file relative paths are ignored
  return { babelrc: false };
}

function getTransformRuntimePlugin(babelTarget) {
  const runtimeConfig = {
    corejs: false,
    helpers: true,
    regenerator: true,
    useESModules: babelTarget !== "node",
  };

  return ["@babel/plugin-transform-runtime", runtimeConfig];
}

function getNodeConfig({ babelTarget }, loadableBabelPlugin) {
  const reactCss = [
    "babel-plugin-react-css-modules",
    Object.assign(
      {
        removeImport: true,
      },
      reactCssPluginOptions
    ),
  ];
  const dynamicImport = ["babel-plugin-dynamic-import-node"];

  const assetsImport = [
    "babel-plugin-transform-assets-import-to-string",
    {
      extensions: [".gif", ".jpeg", ".jpg", ".png", ".svg", ".css", ".scss"],
    },
  ];

  const plugins = commonPlugins.concat([
    getTransformRuntimePlugin(babelTarget),
    reactCss,
    dynamicImport,
    assetsImport,
    ...loadableBabelPlugin,
  ]);

  const envPreset = [
    "@babel/preset-env",
    {
      targets: { node: "current" },
    },
  ];

  const presets = commonPresets.concat([envPreset]);

  return Object.assign(getRemainingConfig(), { plugins, presets });
}

function getBrowserConfig({ env, babelTarget }, loadableBabelPlugin) {
  const reactCss = [
    "babel-plugin-react-css-modules",
    Object.assign({ webpackHotModuleReloading: env !== "production" }, reactCssPluginOptions),
  ];

  const dynamicImport = ["@babel/plugin-syntax-dynamic-import"];

  const plugins = commonPlugins.concat([
    getTransformRuntimePlugin(babelTarget),
    reactCss,
    dynamicImport,
    ...loadableBabelPlugin,
  ]);

  const envPreset = [
    "@babel/preset-env",
    {
      targets: {
        browsers: ["last 2 versions", "safari > 8", "not ie < 11"],
      },
      modules: false,
    },
  ];

  const presets = commonPresets.concat([envPreset]);

  return Object.assign(getRemainingConfig(), { plugins, presets });
}

module.exports = { getConfig };
