const { produce } = require("immer");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
var fs = require("fs");
const path = require("path");

module.exports = {
  modifyWebpackConfig: function({ defaultConfig }) {
    const config = produce(defaultConfig, function(draft) {
      draft.node = { Buffer: false };
      draft.entry["font"] = "./app/client/font.js";
      const dir = "./app/assets/fonts";
      fs.readdir(dir, (err, files) => {
        if (err) return;
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          draft.entry[file] = fullPath;
        });
      });

      if (process.env.ANALYZE_STATS === "true") {
        draft.plugins.push(
          new BundleAnalyzerPlugin({
            generateStatsFile: true,
            analyzerMode: "static",
            statsFilename: "prod-stats.json"
          })
        );
      }
    });
    return { ...config };
  }
};
