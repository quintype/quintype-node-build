const { produce } = require("immer");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
var fs = require("fs");

module.exports = {
  modifyWebpackConfig: function({ defaultConfig }) {
    const config = produce(defaultConfig, function(draft) {
      draft.node = { Buffer: false };
      draft.entry["font"] = "./app/client/font.js";
      const dir = "./app/assets/fonts";
      try {
        fs.readdirSync(dir).forEach(file => {
          const fullPath = `${dir}/${file}`;
          draft.entry[file] = fullPath;
        });
      } catch (error) {
        console.log("Error !!!", error);
      }

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
