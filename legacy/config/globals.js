var fs = require('fs');
var path = require('path');

var config = module.exports =
{
    config :
    {
        env: 'dev', // overridden by build task

        // where the webapp development takes place
        project: {
            root: 'src/',
            assets: 'assets/'
        },

        // build output folders
        target: {
            dev   : 'dist/dev/',
            prod  : 'dist/prod/',
            env   : 'dist/dev'      // overridden by build task
        }
    }
};
var modulePath = path.join(__dirname, './grunt');

fs.readdirSync(modulePath).forEach(function(file){
    config[file.slice(0, -3)] = require(path.join(modulePath, file));
});
