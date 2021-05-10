const { produce } = require("immer");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { resolve } = require("path");
const { readdir } = require("fs").promises;

module.exports = {
  modifyWebpackConfig: function({ defaultConfig }) {
    const config = produce(defaultConfig, function(draft) {
      draft.node = { Buffer: false };
      draft.entry["font"] = "./app/client/font.js";

      async function getFiles(dir) {
        const dirents = await readdir(dir, { withFileTypes: true });
        const files = await Promise.all(
          dirents.map(dirent => {
            const res = resolve(dir, dirent.name);
            return dirent.isDirectory()
              ? getFiles(res)
              : { fileName: dirent.name, filePath: res };
          })
        );
        return files.flat();
      }

      const dir = "./app/static-assets";

      getFiles(dir).then(files =>
        files.forEach(file => (draft.entry[file.fileName] = file.filePath))
      );

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
