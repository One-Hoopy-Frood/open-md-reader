const { merge } = require('webpack-merge')
const commonConfig = require('./webpack.common.js')

// Watch mode for development.
//
// The previous version used webpack-ext-reloader to reload the extension
// automatically on rebuild. It was removed because its dependency chain
// (useragent -> request -> har-validator, uuid@3) is deprecated and
// printed three warnings on every install. It was a devDependency and
// never shipped, but a clean install should be quiet.
//
// HotModuleReplacementPlugin was also dropped. HMR needs a dev server and
// a runtime it can talk to; a content script injected into a file:// page
// has neither, so it did nothing useful here.
//
// After a rebuild finishes, click the reload arrow on the extension card
// at chrome://extensions, then refresh the document tab.
module.exports = merge(commonConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  watch: true,
  watchOptions: {
    ignored: ['**/node_modules'],
  },
  // 'errors-warnings' rather than the shared 'errors-only', so watch mode
  // confirms it rebuilt instead of sitting silent.
  stats: 'errors-warnings',
})
