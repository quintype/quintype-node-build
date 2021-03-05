const { getCssClassNames } = require("./utils");

const reactCssPluginOptions = {
  generateScopedName: getCssClassNames(),
  autoResolveMultipleImports: true
};

const commonPresets = ["@babel/preset-react"];

const commonPlugins = [
  "@babel/plugin-proposal-class-properties",
  "@babel/plugin-proposal-object-rest-spread"
];

function getConfig(opts) {
  switch (opts.babelTarget) {
    case "node":
      return getNodeConfig(opts);
    case "browser":
      return getBrowserConfig(opts);
    default:
      throw new Error(
        "Unknown value for environment variable BABEL_TARGET: " +
          opts.babelTarget
      );
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
    useESModules: babelTarget !== "node"
  };

  return ["@babel/plugin-transform-runtime", runtimeConfig];
}

function getNodeConfig({ babelTarget, loadableBabelPlugin }) {
  const reactCss = [
    "babel-plugin-react-css-modules",
    Object.assign(
      {
        removeImport: true
      },
      reactCssPluginOptions
    )
  ];
  const dynamicImport = ["babel-plugin-dynamic-import-node"];

  const assetsImport = [
    "babel-plugin-transform-assets-import-to-string",
    {
      extensions: [".gif", ".jpeg", ".jpg", ".png", ".svg", ".css", ".scss"]
    }
  ];

  const plugins = commonPlugins.concat([
    getTransformRuntimePlugin(babelTarget),
    reactCss,
    dynamicImport,
    assetsImport,
    loadableBabelPlugin
  ]);

  const envPreset = [
    "@babel/preset-env",
    {
      targets: { node: "current" }
    }
  ];

  const presets = commonPresets.concat([envPreset]);

  return Object.assign(getRemainingConfig(), { plugins, presets });
}

function getBrowserConfig({ env, babelTarget }) {
  const reactCss = [
    "babel-plugin-react-css-modules",
    Object.assign(
      { webpackHotModuleReloading: env !== "production" },
      reactCssPluginOptions
    )
  ];

  const dynamicImport = ["@babel/plugin-syntax-dynamic-import"];

  const plugins = commonPlugins.concat([
    getTransformRuntimePlugin(babelTarget),
    reactCss,
    dynamicImport
  ]);

  const envPreset = [
    "@babel/preset-env",
    {
      targets: {
        browsers: ["last 2 versions", "safari > 8", "not ie < 11"]
      },
      modules: false
    }
  ];

  const presets = commonPresets.concat([envPreset]);

  return Object.assign(getRemainingConfig(), { plugins, presets });
}

module.exports = { getConfig };
