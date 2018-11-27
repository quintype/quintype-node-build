const babelJest = require("babel-jest");

const transformer = babelJest.createTransformer({
  babelrc: false,
  configFile: require.resolve(__dirname, "./babel.js")
});

module.exports = transformer;
