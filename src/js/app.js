(function (window, angular, undefined) {

    var coderApp = angular.module('coderApp', [
        'ngRoute', 'ngCookies', 'ngSanitize', 'ngAnimate', 'ngMaterial', // 'ui.bootstrap', // 'ngTouch',
        'coderControllers', 'coderServices', 'coderDirectives', 'coderFilters',
    ]);

    coderApp.config([
        '$routeProvider', '$locationProvider', '$httpProvider', '$mdIconProvider',
        function( $routeProvider, $locationProvider, $httpProvider, $mdIconProvider ) {

            // $locationProvider.hashPrefix('!'); // necessary for prerendering and SEO
            ace.config.set( 'basePath', 'node_modules/ace-builds/src-min-noconflict' ); // ACE config

            $mdIconProvider.defaultIconSet('/images/icons/content-icons.svg', 24);
            
            $routeProvider
                .when('/home', {
                    templateUrl: 'src/partials/home.html',
                    controller: 'homeCtrl'
                })
                .when('/login', {
                    templateUrl: 'src/partials/login.html',
                    controller: 'loginCtrl'
                })
                .when('/register', {
                    templateUrl: 'src/partials/register.html',
                    controller: 'registerCtrl'
                })
                .when('/editor', {
                    templateUrl: 'src/partials/editor.html',
                    controller: 'editorCtrl'
                })
                .when('/editor/:problem_number/:tab?', {
                    templateUrl: 'src/partials/editor.html',
                    controller: 'editorCtrl'
                })
                .when('/problems', {
                    templateUrl: 'src/partials/problems.html',
                    controller: 'problemsCtrl'
                })
                .when('/problems/:domain', {
                    templateUrl: 'src/partials/problems.html',
                    controller: 'problemsCtrl'
                })
                .when('/personal_info', {
                    templateUrl: 'src/partials/personalInfo.html',
                    controller: 'personalInfoCtrl'
                })
                .when('/payment_info', {
                    templateUrl: 'src/partials/paymentInfo.html',
                    controller: 'paymentInfoCtrl'
                })
                .when('/messenger_demo', {
                    templateUrl: 'src/partials/messenger_demo.html',
                    controller: 'messengerDemoCtrl'
                })
                .when('/sage/insights_toggle', {
                    templateUrl: 'src/partials/sage/insights_toggle.html',
                    controller: 'sageInsightsToggleCtrl'
                })
                .when('/sage/journey/edit', {
                    templateUrl: 'src/partials/sage/journey_edit.html',
                    controller: 'sageJourneyEditCtrl'
                })
                .otherwise({
                    redirectTo: '/sage/insights_toggle'
                });
        }
    ]);
    
    coderApp.run( function( $window, $rootScope, $log, $location ) {
        $rootScope.$on('$locationChangeSuccess', function(event, newUrl, oldUrl) {
            // Util.logEntryInit(); // any init functions here
        });

	(function(d){
	    // load the Facebook javascript SDK
	    var js,
	    id = 'facebook-jssdk',
	    ref = d.getElementsByTagName('script')[0];
	    if (d.getElementById(id)) {
		return;
	    }
	    js = d.createElement('script');
	    js.id = id;
	    js.async = true;
	    js.src = "//connect.facebook.net/en_US/all.js";
	    ref.parentNode.insertBefore(js, ref);
	}(document));

    });
    
})(window, window.angular);

