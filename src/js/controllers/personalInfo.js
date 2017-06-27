(function (window, angular, undefined) {

    angular.module('coderControllers').controller('personalInfoCtrl', [
        '$scope', '$location', '$routeParams', '$log', 'User',
        function($scope, $location, $routeParams, $log, User) {

            $log.log( "loaded personalInfoCtrl ..." );
            $scope.config  = {
                isLoggedIn: User.getUserid() ? true : false,
            };
            $scope.user    = {};
            $scope.user.id = User.getUserid();
                
            $scope.updatePersonalInfo = function() {
                var user = angular.copy( $scope.user );
                var id   = User.getUserid();
                User.updateUser( 
                    user,
                    function( data ) {
                        $location.path( '/payment_info' );
                    },
                    function( data ) {
                        $log.log( "Update user error" );
                        bootbox.alert( data.message );
                    }
                );
            };
	    
        }
    ]);

})(window, window.angular);

