const CopyWebpackPlugin = require( "copy-webpack-plugin" );
const path = require( "path" );

const dirSrc    = `./src`;
const dirAssets = `${dirSrc}/assets`;
const dest      = `${__dirname}/dist`;

module.exports = {
    lintOnSave: false,
    publicPath: "./",
    productionSourceMap: false,
    pages: {
        // self contained page
        index: {
            entry: `${dirSrc}/main.js`,
            template: "public/index.html",
        },
    },
    configureWebpack: {
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    { from: `${dirAssets}/animations`,     to: path.resolve( dest, "assets", "animations" ) },
                    { from: `${dirAssets}/characters`,     to: path.resolve( dest, "assets", "characters" ) },
                    { from: `${dirAssets}/illustrations`,  to: path.resolve( dest, "assets", "illustrations" ) },
                    { from: `${dirAssets}/sprites`,        to: path.resolve( dest, "assets", "sprites" ) },
                ]
            }),
        ]
    },
    chainWebpack: config => {
        // this solves an issue with hot module reload on Safari...
        config.plugins.delete( "preload" );
    },
};
