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
          "babel-plugin-transform-assets-import-to-string",
          // "quintype-assets",
          // [
          //   "react-css-modules",
          //   {
          //     removeImport: true,
          //     generateScopedName: "[name]__[local]__[hash:base64:5]"
          //   }
          // ],
          "transform-class-properties"
        ]
      },
      opts.babelOpts
    )
  );
};
