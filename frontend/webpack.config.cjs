const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { SourceMapDevToolPlugin } = require("webpack");

module.exports = {
  mode: "development",
  entry: "./src/index.jsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash].js",
    clean: true,
    publicPath: "/",
  },
  plugins: [

    new HtmlWebpackPlugin({ template: "./public/index.html" }),
    new webpack.DefinePlugin({
      "process.env.REACT_APP_API_URL": JSON.stringify(process.env.REACT_APP_API_URL),
    }),
    new MiniCssExtractPlugin({
      filename: "styles.[contenthash].css",
    }),
    new SourceMapDevToolPlugin({
      filename: "[file].map",
    }),
  ],
  // devServer: {
  //   static: path.resolve(__dirname, "build/static"),
  //   port: 3000,
  //   open: true,
  //   historyApiFallback: true,
  //   hot: true,

  //   proxy: [
  //     {
  //       context: ["/api", "/auth"],
  //       target: "http://localhost:3000",
  //       router: () => "http://localhost:8000",
  //       logLevel: "debug" /*optional*/,
  //     },
  //   ],
  // },
  devServer: {
    static: path.resolve(__dirname, "build/static"),
    port: 3000,
    open: true,
    historyApiFallback: true,
    hot: true,
    proxy: [
      {
        context: ["/api", "/auth"],
        target: "https://research-dashboard.onrender.com",
        secure: true,
        changeOrigin: true, // Adjust Host header to match target
        logLevel: "debug" // See proxy activity in console
      },
    ]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.svg$/,
        loader: "svg-inline-loader",
      },
      {
        test: /\.m?js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
        type: "asset/inline",
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
};
