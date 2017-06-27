(function (window, angular, undefined) {

    angular.module('coderDirectives').directive( 'headerGeneral', [
        '$log', '$location', 'User',
        function( $log, $location, User ) {
            return {
                // restrict: "E",
                template: "<md-toolbar class=\"demo-toolbar md-primary\"> \
                             <div class=\"md-toolbar-tools\" layout=\"row\" layout-align=\"space-between center\"> \
                               <h3 class=\"ng-binding\"><a href=\"/#/home\">Menturing</a></h3> \
                               <div class=\"md-primary\" layout=\"row\" layout-align=\"end center\"> \
                                 <md-button ng-href=\"#/problems\">Math</md-button> \
                                 <md-button ng-href=\"#/editor\">CS</md-button> \
                                 <md-button ng-if=\"config.isLoggedIn\" ng-click=\"logout()\">Logout</md-button> \
                                 <md-button ng-if=\"! config.isLoggedIn\" ng-href=\"#/login\">Login</md-button> \
                               </div> \
                             </div> \
                           </md-toolbar>",
                link: function( scope ) {
                    scope.config  = {
                        isLoggedIn: User.getUserid() ? true : false,
                    };

                    scope.logout = function() {
                        User.logoutUser();
                        $location.path( '/home' );
                    };

                    scope.gotoLogin = function() {
                        $location.path( '/login' );
                    };
                }
            };
        }
    ]);

})(window, window.angular);
