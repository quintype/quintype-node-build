module.exports = function startDevMode(opts) {
  require("babel-register")(
    Object.assign(
      {
        presets: ["react"],
        plugins: [
          "transform-es2015-modules-commonjs",
          "dynamic-import-node",
          "quintype-assets",
          [
            "react-css-modules",
            {
              removeImport: true,
              generateScopedName: "[name]__[local]__[hash:base64:5]"
            }
          ],
          "transform-class-properties"
        ]
      },
      opts.babelOpts
    )
  );
};
