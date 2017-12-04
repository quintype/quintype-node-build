module.exports = function startDevMode(opts) {
  require("babel-register")(Object.assign({
    presets: ["react"],
    plugins: ["transform-es2015-modules-commonjs"]
  }, opts.babelOpts));
}
