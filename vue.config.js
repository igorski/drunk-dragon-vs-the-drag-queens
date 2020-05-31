const CopyWebpackPlugin = require('copy-webpack-plugin');

const dirSrc    = `./src`;
const dirAssets = `${dirSrc}/assets`;

module.exports = {
    lintOnSave: false,
    configureWebpack: {
        plugins: [
            new CopyWebpackPlugin([
                { from: `${dirAssets}/sprites`, to: 'assets/sprites', flatten: true },
            ]),
        ]
    }
}
