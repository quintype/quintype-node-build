module.exports = function startDevMode(opts) {
  require("css-modules-require-hook")({
    generateScopedName: "[name]__[local]__[hash:base64:5]"
  });
  require("babel-register")(
    Object.assign(
      {
        presets: ["react"],
        plugins: [
          "transform-es2015-modules-commonjs",
          "dynamic-import-node",
          "transform-assets-import-to-string",
          "transform-class-properties",
          "transform-object-rest-spread"
        ]
      },
      opts.babelOpts
    )
  );
};
