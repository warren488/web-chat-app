module.exports = {
  lintOnSave: false,

  chainWebpack: config => ({
    test: /\.mp3$/,
    loader: "url-loader",
    options: {
      limit: 10000
    }
  }),

  pluginOptions: {
    quasar: {
      importStrategy: "kebab",
      rtlSupport: false
    }
  },

  transpileDependencies: ["quasar"]
};
