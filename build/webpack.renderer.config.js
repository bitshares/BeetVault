const path = require('path');
const nodeExternals = require('webpack-node-externals');
const FriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const sass = require('sass');

module.exports = function(env) {
    return {
        entry: {
            modal: "./src/modal.js",
            receipt: "./src/receipt.js",
            app: "./src/app.js",
        },
        output: {
            filename: "[name].js",
            path: path.resolve(__dirname, "../app"),
        },
        target: "electron-renderer",
        mode: env === "production" ? "production" : "development",

        externals: [],
        
        resolve: {
            extensions: ['.*', '.js', '.mjs', '.ts', '.vue', '.json', '.css', '.scss'],
            mainFields: ["browser", "module", "main"],
            alias: {
                vue: "vue/dist/vue.esm-browser.js",
                "vue-router": "vue-router/dist/vue-router.esm-browser.js",
                vue$: 'vue/dist/vue.min.js',
                env: path.resolve(__dirname, `../config/env_${env}.json`),
                '~': path.resolve(__dirname, '../src/'),
                '@/registry/new-york/ui': path.resolve(__dirname, '../src/components/ui/ui'),
                'lucide-vue-next': '@lucide/vue',
                '@': path.resolve(__dirname, '../src/')
            }
        },

        devtool: "source-map",
        
        module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.(js|ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader", "postcss-loader"]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    "style-loader",
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    {
                    loader: "sass-loader",
                    options: {
                        implementation: sass,
                        api: "modern-compiler",
                        sassOptions: {
                            silenceDeprecations: ["import", "global-builtin", "color-functions"],
                        },
                    },
                    },
                ]
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
                dependency: { not: ['url'] }
            }
        ]
        },
    
        plugins: [
            new VueLoaderPlugin(),
            new FriendlyErrorsWebpackPlugin({
                clearConsole: env === "development",
                onErrors: function (severity, errors) {
                    console.log({severity, errors})
                },
            })
        ]
    };
};
