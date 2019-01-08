const babelConfig = require("../config/babel");

module.exports = function startDevMode(opts) {
  require("@babel/register")(Object.assign(babelConfig, opts.babelOpts));
};
