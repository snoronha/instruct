module.exports = function( grunt ) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        shell : {
            clean_coder : {
                command : 'mkdir -p build/js; mkdir -p build/css; rm -rf build/js/*; rm -rf build/css/*;'
            },
        },

        preprocess: {
            coder: {
                src        : 'src/partials/index.html.tmpl',
                dest       : 'index.html',
                options    : {
                    context : { ts: "<%= now %>" }
                }
            },
        },

        concat: {
            coder    : { src: "<%= coder_js_list %>", dest:'build/js/coder_app_<%= now %>.js' },
            vendor_coder : {
                src: "<%= vendor_coder_js_list %>", dest:'build/js/vendor_libs_<%= now %>.js'
            },
            coder_css: {
                src: "<%= coder_css_list %>", dest: 'build/css/coder_app_<%= now %>.css'
            },
        },

        uglify: {
            options    : { mangle: true, compress: false },
            coder     : {
                options: { sourceMap: true, mangle: false, compress: false },
                src    : "<%= coder_js_list %>", // make this work for uglify to replace concat                       
                dest   : 'build/js/coder_app_<%= now %>.js'
            },
        },

        cssmin: {
            coder: {
                files: {
                    'build/css/coder_app_<%= now %>.css': "<%= coder_css_list %>"
                }
            },
        },

        coder_js_list: [
            "src/js/app.js",
            "src/js/modules.js",
            "src/js/services/browser.js",
            "src/js/services/cookie.js",
            "src/js/services/sage.js",
            "src/js/services/user.js",
            "src/js/controllers/editor.js",
            "src/js/controllers/home.js",
            "src/js/controllers/login.js",
            "src/js/controllers/messengerDemo.js",
            "src/js/controllers/paymentInfo.js",
            "src/js/controllers/personalInfo.js",
            "src/js/controllers/prescriptions.js",
            "src/js/controllers/problems.js",
            "src/js/controllers/register.js",
            "src/js/controllers/sageInsightsToggle.js",
            "src/js/controllers/sageJourneyEdit.js",
            "src/js/controllers/welcome.js",
            "src/js/directives/header.js",
            "src/js/directives/math_question.js",
            "src/js/filters/editor.js",
        ],

        vendor_coder_js_list: [
            "node_modules/angular/angular.min.js",            
            "node_modules/angular-resource/angular-resource.min.js",
            "node_modules/angular-route/angular-route.min.js",
            "node_modules/angular-sanitize/angular-sanitize.min.js",
            "node_modules/angular-cookies/angular-cookies.min.js",
            "node_modules/angular-animate/angular-animate.min.js",
            "node_modules/angular-aria/angular-aria.min.js",
            "node_modules/angular-material/angular-material.min.js",
            "node_modules/jquery/dist/jquery.min.js",
            "node_modules/jsplumb/dist/js/jsplumb.min.js",

            "src/js/jsplumb/lib/jsBezier-0.8.js",
		    "src/js/jsplumb/lib/mottle-0.7.4.js",
            "src/js/jsplumb/lib/biltong-0.3.js",
            "src/js/jsplumb/lib/katavorio-0.18.0.js",
            "src/js/jsplumb/src/util.js",
            "src/js/jsplumb/src/browser-util.js",
            "src/js/jsplumb/src/jsPlumb.js",
            "src/js/jsplumb/src/dom-adapter.js",
            "src/js/jsplumb/src/overlay-component.js",
            "src/js/jsplumb/src/endpoint.js",
            "src/js/jsplumb/src/connection.js",
            "src/js/jsplumb/src/anchors.js",
            "src/js/jsplumb/src/defaults.js",
            "src/js/jsplumb/src/connectors-bezier.js",
            "src/js/jsplumb/src/connectors-statemachine.js",
            "src/js/jsplumb/src/connectors-flowchart.js",
            "src/js/jsplumb/src/connectors-straight.js",
            "src/js/jsplumb/src/renderers-svg.js",
            "src/js/jsplumb/src/base-library-adapter.js",
            "src/js/jsplumb/src/dom.jsPlumb.js",
            
            "src/js/vendor/mathquill/build/mathquill.js",
            "node_modules/ace-builds/src-min-noconflict/ace.js",
        ],

        coder_css_list: [
            "node_modules/angular-material/angular-material.min.css",
            "node_modules/angular-material/angular-material.layouts.min.css",
            
            "src/css/jsplumb/jsPlumbToolkit-defaults.css",
            "src/css/jsplumb/main.css",
            "src/css/jsplumb/jsPlumbToolkit-demo.css",
            "src/css/jsplumb/demo_flowchart.css",
            
            "src/css/helper.css",
        ],

        now: (new Date()).getTime()
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );
    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-cssmin' );
    grunt.loadNpmTasks( 'grunt-preprocess' );
    grunt.loadNpmTasks( 'grunt-shell' );

       grunt.registerTask( 'default', 'Build', function() {
        var hostname = require("os").hostname();
        if ( hostname.match( /www/ )) {
            grunt.log.writeln( 'Running PRODUCTION build on ' + hostname + ' ...' );
            grunt.task.run([
                'shell:clean_coder', 'preprocess',
                'uglify:coder', // 'concat:coder',
                'concat:vendor_coder', 'concat:coder_css',
            ]);
        } else {
            grunt.log.writeln( "Running development build on " + hostname + " ..." );
            grunt.task.run([
                'shell:clean_coder', 'preprocess',
                'uglify:coder', // 'concat:coder',
                'concat:vendor_coder', 'concat:coder_css',
            ]);
        }
    });

};

