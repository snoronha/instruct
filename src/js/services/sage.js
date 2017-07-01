(function (window, angular, undefined) {

    angular.module( 'coderServices').service( 'Sage', [ '$http', '$log', function( $http, $log ) {

        var that = this;

        this.updateSettings = function( settings, success, failure ) {
            var url     = '/v1/users/update_settings';
            $http({
                method: 'POST',
                url: url,
                data: settings,
                headers: {'Content-Type': 'application/json'}
            }).success( function( data, status, headers, config ) {
                if ( angular.isFunction( success )) {
                    success( data );
                }
            }).error( function( data, status, headers, config ) {
                $log.log( "Error Data: ", data );
                if ( angular.isFunction( failure )) {
                    failure( data );
                }
            });
        };
        
        this.getSettings = function( successCallback, errorCallback ) {
            var url = '/v1/users/get_settings';
            $http({ method: 'GET', url: url, headers: {'Content-Type': 'application/json'} }).then(
                function( response ) {
                    if ( angular.isFunction( successCallback )) {
                        successCallback( response );
                    }
                },
                function( response ) {
                    if ( angular.isFunction( errorCallback )) {
                        errorCallback( response );
                    }
                }
            );
        };

        this.updateStateDiagram = function( states, edges, success, failure ) {
            var url     = '/v1/users/update_state_diagram';
            $http({
                method: 'POST',
                url: url,
                data: {states: states, edges: edges},
                headers: {'Content-Type': 'application/json'}
            }).success( function( data, status, headers, config ) {
                if ( angular.isFunction( success )) {
                    success( data );
                }
            }).error( function( data, status, headers, config ) {
                $log.log( "Error Data: ", data );
                if ( angular.isFunction( failure )) {
                    failure( data );
                }
            });
        };
    }]);
    
})(window, window.angular);
