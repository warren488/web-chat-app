// vue.config.js
const { defineConfig } = require("@vue/cli-service");
const CreateFileWebpack = require("create-file-webpack");
const uuid = require("uuid");
process.env.VUE_APP_VER = uuid();

module.exports = {
  lintOnSave: false,
  configureWebpack: {
    plugins: [
      new CreateFileWebpack({
        path: "./dist",
        fileName: "versionuid.json",
        content: `{"uuid": "${process.env.VUE_APP_VER}"}`
      })
    ]
  }
  // options...
};
