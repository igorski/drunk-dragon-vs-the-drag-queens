module.exports = {
    js: {
        files: '<%= config.project.root %>**/*.js',
        tasks: ['browserify:dev']
    },
    css: {
        files: '<%= config.project.assets %>**/*.less',
        tasks: ['copy:assets']
    },
    html: {
        files: '<%= config.project.root %>**/*.html',
        tasks: ['copy:app', 'replace:dev']
    }
};
