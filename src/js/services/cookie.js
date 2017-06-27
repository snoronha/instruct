(function (window, angular, undefined) {

    angular.module('coderServices').service('Cookie', [
        '$http', '$cookies', '$log', 
        function( $http, $cookies, $log ) {
            
            this.setCookie = function( key, val ) {
                if ( key && val ) {
                    // $.cookie( key, val, { path: '/' });
                    $cookies.put( key, val, { path: '/' });
                }
            };

            this.getCookie = function( key ) {
                if ( $cookies.get( key )) {
                    return $cookies.get( key );
                } else {
                    return "";
                }
                /*
                if ( $.cookie( key )) {
                    return $.cookie( key );
                } else {
                    return "";
                }
                */
            };

            this.deleteCookie = function( key ) {
                // $.removeCookie( key, { path: '/' } );
                $cookies.remove( key, { path: '/' } );
            };
        }
    ]);
})(window, window.angular);
