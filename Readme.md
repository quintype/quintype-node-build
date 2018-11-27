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
