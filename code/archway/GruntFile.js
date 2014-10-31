module.exports = function(grunt) {
	var appJSFiles = [
		'src/js/app.js',
		'src/js/models/*.js',
		'src/js/controllers/*.js',
		'src/js/views/*.js'
	];

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			production: {
				src: ['src/js/*.js']
			}
		},
		uglify: {
			production: {
				files: [{
					'build/intermediates/app.min.js': appJSFiles,
					'build/intermediates/background.js': 'src/chrome-app-stuff/background.js'
				}],
			},
			develop: {
				options: {
					mangle: false,
					compress: false,
					beautify: true
				},
				files: [{
					'build/intermediates/app.js': appJSFiles,
					'build/intermediates/background.js': 'src/chrome-app-stuff/background.js'
				}],
			}
		},
		emberTemplates: {
			develop: {
				options: {
					templateBasePath: 'src/templates/'
				},
				files: {
					'build/app/templates/templates.js': ['src/templates/**/*.hbs']
				}
			}
		},
		include_bootstrap: {
			develop: {
				options: {
					sourceMap: true,
					dumpLineNumbers: 'comments',
					relativeUrls: true
				},
				files: {
					'build/app/css/style.css': 'src/less/manifest.less',
				},
			},
			production: {
				options: {
					cleancss: true,
					compress: true,
					relativeUrls: true
				},
				files: {
					'build/app/css/style.css': 'src/less/manifest.less',
				},
			}
		},
		/*
		less: {
			production: {
				options: {
					compress: true
				},
				src: 'src/less/base.less',
				dest: 'build/intermediates/style.css'
			}
		},
		*/
		concat: {
			production: {
				files: [
					{ 'build/app/js/app.js': [ 'build/intermediates/app.min.js' ] }
				]
			},
			develop: {
				files: [{
					'build/app/js/app.js': [
						'build/intermediates/app.js'
					]
				}]
			}
		},
		copy: {
			production: {
				files: [{
					//'www/js/modernizr-2.6.2.js': 'src/js/client/lib/modernizr-2.6.2.js',
					'build/app/js/app.js': 'build/intermediates/app.js',
					'build/app/index.html': 'src/index.html',
					//'build/app/css/style.css': 'build/intermediates/style.css',
					'build/app/background.js': 'build/intermediates/background.js',
					'build/app/manifest.json': 'src/chrome-app-stuff/manifest.json'
				}, {
					expand: true,
					cwd: 'src/js/libs',
					src: '**/*.js',
					dest: 'build/app/js/libs/'
				}/*, {
					expand: true,
					cwd: 'src/objects/',
					dest: 'www/objects',
					src: '**',
					flatten: true
				}, {
					expand: true,
					cwd: 'src/textures/',
					dest: 'www/textures',
					src: '**'
				}*/]
			}
		},
		
		watch: {
			files: [
				'src/js/**/*.js', 
				'src/templates/**/*.hbs',
				'src/index.html', 
				'src/less/**/*.less',
				'src/less/**/*.css',
				'src/chrome-app-stuff/**/*.js', 
				'src/chrome-app-stuff/manifest.json'
			],
			tasks: ['default'],
		},
	});

	//grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-ember-templates');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-include-bootstrap');

	// Default task(s).
	//grunt.registerTask('default', ['emberTemplates:develop', 'uglify:develop', 'less', 'concat:develop', 'copy']);
	grunt.registerTask('default', ['emberTemplates:develop', 'uglify:develop', 'include_bootstrap:develop', 'concat:develop', 'copy']);
	
	grunt.registerTask('compile-js', ['uglify:develop', 'concat:develop', 'copy']);
	//grunt.registerTask('lessify', ['less', 'copy']);
	grunt.registerTask('lessify', ['include_bootstrap:develop', 'copy']);
	
	
	grunt.registerTask('build-production', ['uglify:production', 'less:production', 'concat:production', 'copy']);

};