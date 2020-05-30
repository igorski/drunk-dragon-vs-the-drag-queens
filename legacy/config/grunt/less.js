module.exports =
{
    prod: {
        options: {
            paths: [ "<%= config.target.assets %>/css/**/*" ],
            compress: true,
            ieCompat: false,
            relativeUrls: true
         /*
         ,modifyVars: {
            imgPath: '"http://mycdn.com/path/to/images"'
          }
          */
        },
        files: {
          "<%= config.target.prod %>assets/css/layout.min.css": "assets/css/layout.less"
        }
      }
};
