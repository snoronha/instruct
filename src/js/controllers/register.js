(function (window, angular, undefined) {

    angular.module( 'coderControllers' ).controller( 'registerCtrl', [
        '$scope', '$timeout', '$location', '$mdSidenav', '$log', 'User',
        function( $scope, $timeout, $location, $mdSidenav, $log, User ) {
            
            $log.log( "loaded registerCtrl ..." );
            $scope.user = {};

            $scope.toggleLeft = buildDelayedToggler('left');
            $scope.toggleRight = buildToggler('right');
            $scope.isOpenRight = function() {
                return $mdSidenav('right').isOpen();
            };

            $scope.insertUser = function() {
                var popupContainer = '#popupContainer';
                var user  = angular.copy( $scope.user );
                console.log( "USER: ", user );
                User.insertUser( 
                    user, popupContainer, 
                    function( data ) {
                        User.loginUser( data );
                        $location.path( '/personal_info' );
                    },
                    function( data ) {
                        $log.log( "Registration error" );
                        User.showAlert( popupContainer, "Registration Error", data );
                    }
                );
            };

            $scope.logout = function() {
                User.logoutUser();
                $location.path( '/home' );
            };

            function debounce( func, wait, context ) {
                var timer;
                return function debounced() {
                    var context = $scope, args = Array.prototype.slice.call( arguments );
                    $timeout.cancel( timer );
                    timer = $timeout(function() {
                        timer = undefined;
                        func.apply( context, args );
                    }, wait || 10);
                };
            }

            /**
             * Build handler to open/close a SideNav; when animation finishes
             * report completion in console
             */
            function buildDelayedToggler(navID) {
                return debounce(function() {
                    $mdSidenav(navID)
                        .toggle()
                        .then(function () {
                            $log.debug("toggle " + navID + " is done");
                        });
                }, 200);
            }
            
            function buildToggler(navID) {
                return function() {
                    $mdSidenav(navID)
                        .toggle()
                        .then(function () {
                            $log.debug("toggle " + navID + " is done");
                        });
                }
            }
            
	}
    ]);

    angular.module( 'coderControllers' ).controller( 'LeftCtrl', [
        '$scope', '$timeout', '$mdSidenav', '$log',
        function( $scope, $timeoutd, $mdSidenav, $log ) {
            $scope.close = function () {
                $mdSidenav('right').close()
                    .then(function () {
                        $log.debug("close RIGHT is done");
                    });
            };
	}
    ]);

})(window, window.angular);
