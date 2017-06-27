(function (window, angular, undefined) {

    angular.module( 'coderControllers' ).controller( 'messengerDemoCtrl', [
        '$window', '$scope', '$timeout', '$location', '$log', '$routeParams', 'User',
        function( $window, $scope, $timeout, $location, $log, $routeParams, User ) {
            $log.log( "loaded messengerDemoCtrl ..." );
	    
	    $window.fbAsyncInit = function() {
		FB.init({ 
		    appId: '1748781152068659',
		    status: true, 
		    cookie: true, 
		    xfbml: true,
		    version: 'v2.4'
		});
	    };	    
	}
    ]);

})(window, window.angular);
