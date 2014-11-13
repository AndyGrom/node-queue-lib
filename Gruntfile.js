/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        // Task configuration.
        browserify: {
            dist: {
                files: {
                    'test-browser/queue.browser.spec.js': ['test-browser/queue.spec.js'],
                    'lib/client/queue.client.js': ['lib/queue.client.js']
                }
            }
        },
        uglify: {
            my_target: {
                files: {
                    'lib/client/queue.client.min.js': ['lib/client/queue.client.js']
                }
            }
        },
        jasmine_node: {
            coverage: {
            },
            options: {
                forceExit: true,
                specFolders : ['./spec/']
            },
            all: ['spec/']
        },
        markdown : {
            all: {
                files: [
                    {
                        expand: true,
                        src: './readme.md',
                        dest: './doc/',
                        ext: '.html'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-jasmine-node-coverage');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-markdown');

    grunt.registerTask('default', ['browserify', 'uglify', 'jasmine_node']);
    grunt.registerTask('test', ['jasmine_node']);
    grunt.registerTask('readme', ['markdown']);
};
