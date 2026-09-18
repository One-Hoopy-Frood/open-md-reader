const { resolve } = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const FriendlyErrors = require('@nuxt/friendly-errors-webpack-plugin')
const SveltePreprocess = require('svelte-preprocess')

module.exports = {
  entry: {
    content: resolve(__dirname, '../src/main.ts'),
    background: resolve(__dirname, '../src/background.ts'),
    popup: resolve(__dirname, '../src/popup/index.ts'),
  },
  output: {
    filename: 'js/[name].js',
    path: resolve(__dirname, '../extension'),
    publicPath: './',
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        use: {
          loader: 'esbuild-loader',
          options: { loader: 'ts', target: 'esnext' },
        },
        exclude: /node_modules/,
      },
      // SMUI 9 publishes ESM with extensionless relative imports, such as
      // `import { deprecated } from './mdc'`. Webpack 5 rejects those in a
      // strict ES module unless fully specified resolution is relaxed.
      // Without this, @smui/ripple and @smui/chips fail on about twenty
      // internal paths: ./mdc, ./ponyfill, ./foundation, ./adapter and so on.
      // This rule only changes resolution; it adds no loader.
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.svelte$/,
        use: {
          loader: 'svelte-loader',
          options: {
            // Options are passed explicitly rather than left to tsconfig
            // discovery. tsconfig.json has include: ["src/**/*"], so SMUI's
            // components under node_modules fall back to TypeScript's own
            // defaults, where target is ES5. That downlevels object rest
            // into a __rest helper and splits the $props() destructuring,
            // which makes Svelte 5 reject $bindable() with
            // bindable_invalid_location.
            preprocess: SveltePreprocess.typescript({
              compilerOptions: {
                target: 'esnext',
                verbatimModuleSyntax: true,
              },
            }),
          },
        },
      },
      // Plain CSS: no Less. SMUI ships a large compiled bare.css that
      // Less cannot parse, and it fails with "Unrecognised input".
      // Nothing in a .css file needs the Less compiler anyway.
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              esModule: false,
            },
          },
        ],
      },
      // Less sources only.
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              esModule: false,
            },
          },
          'less-loader',
        ],
      },
      {
        test: /\.svg$/,
        use: 'svg-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.woff2$/,
        type: 'asset/resource',
        generator: {
          outputPath: 'fonts',
          publicPath: 'chrome-extension://__MSG_@@extension_id__/fonts/',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.mjs', '.ts', '.js', '.svelte', '.json', '.less'],
    // 'svelte' in both lists is what lets webpack see Svelte libraries at
    // all. Required by svelte-loader and by SMUI. The '...' spreads
    // webpack's own defaults; replacing them outright drops its 'webpack'
    // condition and pulls Node builds of browser packages, which is how
    // @viz-js/viz started demanding a 'url' polyfill.
    mainFields: ['svelte', 'browser', '...'],
    conditionNames: ['svelte', 'browser', '...'],
    alias: {
      '@': resolve(__dirname, '../src'),
      // Deliberately no `svelte` alias here. Aliasing it to
      // svelte/src/runtime is Svelte 3 era advice; Svelte 5 reorganised the
      // package, so the alias breaks every subpath import
      // (svelte/internal/client, svelte/store, svelte/events and friends)
      // and produced about sixty errors. conditionNames handles this now.
    },
  },
  stats: 'errors-only',
  plugins: [
    new FriendlyErrors(),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve(__dirname, '../src/manifest.json'),
        },
        {
          from: resolve(__dirname, '../src/_locales'),
          to: '_locales',
        },
        {
          from: resolve(__dirname, '../src/images'),
          to: 'images',
        },
        {
          from: resolve(__dirname, '../src/popup/index.html'),
          to: 'popup.html',
        },
      ],
    }),
  ],
}
