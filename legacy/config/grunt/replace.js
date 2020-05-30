module.exports = {
    dev: {
        src: ['<%= config.project.root %>index.dev.html'],
        dest: ['<%= config.target.dev %>index.html'],
        replacements: [
            {
                from: '{{title}}',
                to: '<%= pkg.name %>'
            },
            {
                from: '{{css}}',
                to: '<%= pkg.name %>.css'
            },
            {
                from: '{{js}}',
                to: '<%= pkg.name %>.js'
            }
        ]
    },
    prod: {
        src: ['<%= config.project.root %>index.prod.html'],
        dest: ['<%= config.target.prod %>index.html'],
        replacements: [
            {
                from: '{{title}}',
                to: '<%= pkg.name %>'
            },
            {
                from: '{{css}}',
                to: '<%= pkg.name %>.css'
            },
            {
                from: '{{js}}',
                to: '<%= pkg.name %>.js'
            }
        ]
    }
};