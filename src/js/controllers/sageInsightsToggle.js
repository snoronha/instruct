(function (window, angular, undefined) {

    angular.module( 'coderControllers' ).controller( 'sageInsightsToggleCtrl', [
        '$scope', '$location', '$routeParams', '$log', '$timeout', '$mdDialog', 'Sage',
        function( $scope, $location, $routeParams, $log, $timeout, $mdDialog, Sage ) {

            $log.log( "loaded sageInsightsToggleCtrl ..." );
            $scope.user   = {};
            var settingsBak = {};
            
            //--- On load, get settings ---//
            Sage.getSettings(
                function( response ) {
                    // $location.path( '/home' );
                    $scope.settings = response.data;
                    settingsBak     = angular.copy(response.data);
                },
                function( data ) {
                    $log.log( "Registration error" );
                }
            );

            // Click handler for update
            $scope.updateSettings = function() {
                Sage.updateSettings( 
                    $scope.settings, 
                    function( data ) {
                        $log.log( "Updated: ", data );
                    },
                    function( data ) {
                        $log.log( "Registration error" );
                        bootbox.alert( data.message );
                    }
                );
            };

            $scope.cancelSettings = function() {
                $scope.settings = angular.copy(settingsBak);
            };

            $scope.priorityChanged = function(setting, oldPriority) {
                if (setting.priority == 0) {
                    angular.forEach($scope.settings, function(settingRow, index) {
                        if (settingRow.priority == 0 && setting.name != settingRow.name) {
                            settingRow.priority = 1;
                        }
                    });
                }
            }
            
            $scope.navigateTo = function(to, event) {
                $mdDialog.show(
                    $mdDialog.alert()
                        .title('Navigating')
                        .textContent('Imagine being taken to ' + to)
                        .ariaLabel('Navigation demo')
                        .ok('Neat!')
                        .targetEvent(event)
                );
            };

	    }
    ]);

})(window, window.angular);
