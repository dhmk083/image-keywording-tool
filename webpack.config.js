const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = (env, argv) => ({
  entry: {
    mainForm: "./src/components/MainForm",
    keywordsForm: "./src/components/KeywordsForm",
  },
  output: {
    path: __dirname + "/build",
  },
  devtool: "eval-source-map",
  target: "electron-renderer",
  resolve: {
    extensions: [".js", ".ts", ".tsx"],
    plugins: [new TsconfigPathsPlugin()],
  },
  externals: {
    sharp: "sharp",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "ts-loader",
      },
      {
        test: /\.s?css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: {
                auto: (path) => !path.endsWith("global.scss"),
                localIdentName: "[path][name]__[local]",
              },
            },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: "file-loader",
      },
    ],
  },
  plugins: [
    process.platform !== "darwin"
      ? new webpack.IgnorePlugin({
          resourceRegExp: /^fsevents$/,
        })
      : null,
    argv.mode === "development" ? new Dotenv() : null,
  ].filter(Boolean),
});
