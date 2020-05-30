var globals = require("./config/globals");

module.exports = function( grunt )
{
    grunt.initConfig(
    {
        pkg:         grunt.file.readJSON( "package.json" ),
        config:      globals.config,
        browserify:  globals.browserify,
        jshint:      globals.jshint,
        clean:       globals.clean,
        replace:     globals.replace,
        copy:        globals.copy,
        browserSync: globals.browsersync,
        watch:       globals.watch,
        uglify:      globals.uglify,
        less:        globals.less
    });

    grunt.loadNpmTasks( "grunt-browserify" );
    grunt.loadNpmTasks( "grunt-contrib-jshint" );
    grunt.loadNpmTasks( "grunt-contrib-clean" );
    grunt.loadNpmTasks( "grunt-text-replace" );
    grunt.loadNpmTasks( "grunt-contrib-copy" );
    grunt.loadNpmTasks( "grunt-browser-sync" );
    grunt.loadNpmTasks( "grunt-contrib-watch" );
    grunt.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.loadNpmTasks( "grunt-contrib-less" );

    grunt.registerTask( "dev", [ "build:dev", "browserSync", "watch" ]);

    grunt.registerTask( "build", function( env )
    {
        env        = env || "prod";
        var target = grunt.config.data.config.target;
        target.env = env === "prod" ? target.prod : target.dev;
        grunt.config.data.env = env;

        switch ( env )
        {
            case "dev":
                grunt.task.run( "clean:dev" );
                grunt.task.run( "copy:app" );
                grunt.task.run( "copy:assets" );
                grunt.task.run( "replace:dev" );
                grunt.task.run( "browserify:dev" );
                break;

            case "prod":
                //grunt.task.run( "jshint" );
                grunt.task.run( "clean:prod" );
                grunt.task.run( "copy:app" );
                grunt.task.run( "copy:assets" );
                grunt.task.run( "replace:prod" );
                grunt.task.run( "less:prod" );
                grunt.task.run( "browserify:prod" );
                grunt.task.run( "uglify:prod" );
                break;
        }
    });
};
