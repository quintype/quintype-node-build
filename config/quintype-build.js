const { produce } = require("immer");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { resolve } = require("path");
const fs = require("fs");

module.exports = {
  modifyWebpackConfig: function({ defaultConfig }) {
    const config = produce(defaultConfig, function(draft) {
      draft.entry["font"] = "./app/client/font.js";

      const staticAssets = "./app/static-assets";
      function getFiles(staticAssets) {
        const dirents = fs.readdirSync(staticAssets, { withFileTypes: true });
        const files = dirents.map(dirent => {
          const res = resolve(staticAssets, dirent.name);
          return dirent.isDirectory()
            ? getFiles(res)
            : { fileName: dirent.name, filePath: res };
        });
        return files.flat();
      }
      fs.existsSync(staticAssets) &&
        getFiles(staticAssets).forEach(file => {
          draft.entry[file.fileName] = file.filePath;
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
