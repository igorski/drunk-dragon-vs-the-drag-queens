var fs      = require( "fs" );
var path    = require( "path" );
var grunt   = require( "grunt" );
var globals = require( "../globals" );
var pkg     = grunt.file.readJSON( "./package.json" );

module.exports =
{
    app:
    {
        files: [
        {
            expand: true,
            cwd: "<%= config.project.root %>",
            src: [ "**/*.!html", "**/vendor/**/*" ],
            dest: "<%= config.target.env %>"
        }]
    },
    assets:
    {
        files: [
        {
            expand: true,
            cwd: "<%= config.project.assets %>",
            src: [ "**/*" ],
            dest: "<%= config.target.env %>/assets"
        }]
    }
};
