function getCssClassNames() {
  return process.env.MINIFY_CSS_CLASSNAMES === "true"
    ? "[hash:base64:5]"
    : "[name]__[local]__[hash:base64:5]";
}

module.exports = {
  getCssClassNames
};
