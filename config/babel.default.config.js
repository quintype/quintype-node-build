const reactCssPluginOptions = {
  generateScopedName: "[name]__[local]__[hash:base64:5]"
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
      return getBroweserConfig(opts);
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

function getNodeConfig() {
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

  const runtimeGenerator = ["@babel/plugin-transform-runtime"];

  const plugins = commonPlugins.concat([
    reactCss,
    dynamicImport,
    assetsImport,
    runtimeGenerator
  ]);

  const envPreset = ["@babel/preset-env", { targets: { node: "current" } }];

  const presets = commonPresets.concat([envPreset]);

  return Object.assign(getRemainingConfig(), { plugins, presets });
}

function getBroweserConfig({ env }) {
  const reactCss = [
    "babel-plugin-react-css-modules",
    Object.assign(
      { webpackHotModuleReloading: env !== "production" },
      reactCssPluginOptions
    )
  ];
  const dynamicImport = ["@babel/plugin-syntax-dynamic-import"];

  const plugins = commonPlugins.concat([reactCss, dynamicImport]);

  const envPreset = ["@babel/preset-env", { modules: false }];

  const presets = commonPresets.concat([envPreset]);

  return Object.assign(getRemainingConfig(), { plugins, presets });
}

module.exports = { getConfig };
