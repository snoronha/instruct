(function (window, angular, undefined) {

    angular.module('coderControllers').controller('welcomeCtrl', [
        '$scope', '$location', '$routeParams', '$log',
        function($scope, $location, $routeParams, $log) {

            $log.log( "loaded welcomeCtrl ..." );

            $scope.requestInvite = function() {
                $location.path( '/request_invite' );
            };

        }
    ]);

})(window, window.angular);

