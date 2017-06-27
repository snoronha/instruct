(function (window, angular, undefined) {

    angular.module( 'coderControllers' ).controller( 'homeCtrl', [
        '$scope', '$location', '$routeParams', '$log', 'User',
        function( $scope, $location, $routeParams, $log, User ) {

            $log.log( "loaded homeCtrl ..." );
            // $scope.config = {
            // isLoggedIn: User.getUserid() ? true : false,
            // };
            $scope.user   = {};

	    }
    ]);

})(window, window.angular);

