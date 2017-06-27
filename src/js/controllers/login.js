(function (window, angular, undefined) {

    angular.module( 'coderControllers' ).controller( 'loginCtrl', [
        '$scope', '$location', '$routeParams', '$log', 'User',
        function( $scope, $location, $routeParams, $log, User ) {

            $log.log( "loaded loginCtrl ..." );
            $scope.user   = {};

            $scope.authUser = function() {
                var user = angular.copy( $scope.user );
                User.authUser( 
                    user, 
                    function( data ) {
                        User.loginUser( data );
                        $location.path( '/home' );
                    },
                    function( data ) {
                        $log.log( "Registration error" );
                        bootbox.alert( data.message );
                    }
                );
            };
	    }
    ]);

})(window, window.angular);
