Add notes on

1) Assets
2) Babel (and the inability to add a babelrc)
3) CSS modules (.module.css)

## Upgrading to @quintype/build 2

In order to upgrade to build 2 (which comes with Webpack 4), run the following command:

```sh
npm install -D @quintype/build@2 webpack@4 webpack-cli webpack-dev-server@3 babel-plugin-dynamic-import-node babel-loader css-loader file-loader sass-loader
```

## Babel configs

We have to manage babel configs for three environments - server, client and test. For most part the test configuration should be the same as the server configuration.

On server side code, we need babel to
  - transpile the code as per the running NodeJS version
  - transform ES modules to CJS modules
  - transform any dynamic imports
  - replace import of assets with a static string
  - let css module classes be generated and added to markup

On client side code, we need babel to
  - transpile code as per some browserlist config
  - keep ES modules as is, let webpack handle it
  - keep dynamic imports as is, let webpack handle it

To enable better development workflow, we want the server code to be transpile on the fly. This is demonstrated in `index.js`

In production mode, we don't want on the fly transpilation. Instead we want to overwrite the src files with the transpiled ones during the Docker image build stage.

### Places where babel config is defined

- index.js (server dev time)
- default-babel-rc (server prod time)
- bin/quintype-build (server prod time)
- webpack.config.js (client)

### Requirements of new babel/webpack configs

- should allow running only babel on the server code
- should support BABEL_TARGET and NODE_ENV to allow generating config for browser/server and dev/prod combinations
- should be able override babel config via app specific JS
- should be able override webpack config via app specific JS
- should be able to pass it to jest/mocha with necessary options set
- should be able to get entire babel/webpack config as a JS object to easily merge it with storybook config

For Jest (tests),
- Use a custom transformer file to give the path of babel config

For Babel Register (server side, dev mode),
- It directly accepts the path to the config file

For Babel CLI (server side, prod mode),
- It directly accepts the path to the config file

For Webpack (browser, prod & dev mode)
- Babel Loader can be given the path to the babel config file.
- Babel Loader can also accept the entire babel config as an object

Steps,
- The babel config file is loaded
- It will read environment variables BABEL_TARGET and NODE_ENV to determine if config is for server/browser and prod/dev.
- It will read the `quintype-build.config.js` file if present in the application root, ie the working directory.
- The file will export build options object. It can have functions like `modifyBabel`, `modifyWebpack` to allow the developer to customize the babel/webpack config.
- The default config is prepared based on environment variables and then passed to `modifyBabel` for augmentation. The returned config is exported.

### Migration to build@3

- Remove all packages that have been moved to build or that are not required.
```sh
npm uninstall babel-cli babel-core babel-loader babel-plugin-dynamic-import-node babel-plugin-transform-assets-import-to-string babel-preset-env babel-preset-es2015 babel-preset-es2015-tree-shaking babel-preset-react babel-loader duplicate-package-checker-webpack-plugin webpack-common-shake
```

- Update build
```sh
npm install @quintype/build@latest
or
npm install @quintype/build@^3
```

- Update package.json to add the name of the publisher, this will be used for namespacing the assets folder.

- Add quintype.config.js file with the following:
```js
const produce = require("immer");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
  modifyWebpackConfig: function({ defaultConfig }) {
    return produce(defaultConfig, function(draft) {
      draft.node = { Buffer: false };
      draft.entry.push({ font: "./app/client/font.js" });
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
  }
};
```

- add BABEL_TARGET as `node` or `browser` to the following npm scripts as required:
```json
"analyze-stats": "NODE_ENV=production ANALYZE_STATS=true BABEL_TARGET=browser npx webpack --profile --mode=production -p",
"asset-server": "BABEL_TARGET=browser webpack-dev-server --hot",
"compile": "BABEL_TARGET=browser webpack",
"dev-server": "nodemon --watch app/server --watch app/isomorphic --exec 'BABEL_TARGET=node node start.js' --signal SIGHUP",
```

- add the webpack config file as `./node_modules/@quintype/build/config/webpack.js` to the following npm scripts
```json
"analyze-stats": "NODE_ENV=production ANALYZE_STATS=true BABEL_TARGET=browser npx webpack --config ./node_modules/@quintype/build/config/webpack.js --profile --mode=production -p",
"asset-server": "BABEL_TARGET=browser webpack-dev-server --hot --config ./node_modules/@quintype/build/config/webpack.js",
"compile": "BABEL_TARGET=browser webpack --config ./node_modules/@quintype/build/config/webpack.js",
```

- delete webpack.config.js
