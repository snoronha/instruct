(function (window, angular, undefined) {

    angular.module( 'coderServices').service( 'Sage', [ '$http', '$log', function( $http, $log ) {

        var that = this;

        //---------------- SAGE API -----------------//

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

        this.getStateDiagram = function( successCallback, errorCallback ) {
            var url = '/v1/users/get_state_diagram';
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


        //---------------- SAGE UTILS -----------------//

        // parse from format *Window_(\d+) and *Window_(\d+)_(\d+)
        this.getInnerAndOuterMatches = function(str) {
            innerMatch = str.match(/Window_(\d+)_(\d+)$/);
            outerMatch = str.match(/Window_(\d+)$/);
            return { innerMatch: innerMatch, outerMatch: outerMatch };
        };

        this.getConditionTemplate = function(outerWindowElemId, state, numBoxes) {
            var x = state.x || 0, y = state.y || 0;
            var html = "<div class=\"outer-window\" id=\"" + outerWindowElemId + "\" style=\"left: " + x + "px; top: " + y + "px;\">";
            html    += "<div class=\"outer-window-header\" layout=\"row\" layout-align=\"center center\"><span ng-click=\"updateLabel($event)\" data-id=\"" + outerWindowElemId + "\">" + state.text + "</span></div>";
            for (var i = 0; i < numBoxes; i++) {
                var child_node = state.child_nodes[i];
                var innerWindowElemId = "innerflowchartWindow_" + child_node.id;
                html += "<div class=\"inner-window col-md-1\" id=\"" + innerWindowElemId + "\" layout=\"row\" layout-align=\"center center\"><span ng-click=\"updateLabel($event)\" data-id=\"" + innerWindowElemId + "\">" + child_node.text + "</span></div>";
            }
            html += "</div>";
            return html;
        };

        this.getActionTemplate = function(outerWindowElemId, state, color) {
            var x = state.x || 0, y = state.y || 0;
            var html = "<div class=\"outer-window\" id=\"" + outerWindowElemId + "\" style=\"left: " + x + "px; top: " + y + "px;\">";
            html    += "<i class=\"material-icons\" style=\"font-size: 18px; position: absolute; right: -5px; top: -5px; z-index: 1000;\" ng-click=\"deleteState($event)\" data-id=\"" + outerWindowElemId + "\">cancel</i>";
            var child_node = state.child_nodes[0];
            var innerWindowElemId = "innerflowchartWindow_" + child_node.id;
            html += "<div class=\"inner-window-action col-md-12\" id=\"" + innerWindowElemId + "\" style=\"background-color: " + color + ";\" layout=\"row\" layout-align=\"center center\"><span ng-click=\"updateLabel($event)\" data-id=\"" + innerWindowElemId + "\">" + child_node.text + "</span></div>";
            html += "</div>";
            return html;
        };

    }]);
    
})(window, window.angular);
