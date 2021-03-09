const { produce } = require("immer");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
  modifyWebpackConfig: function({ defaultConfig }) {
    const config = produce(defaultConfig, function(draft) {
      draft.entry["font"] = "./app/client/font.js";
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
