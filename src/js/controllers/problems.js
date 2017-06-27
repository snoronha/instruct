(function (window, angular, undefined) {

    angular.module( 'coderControllers' ).controller( 'problemsCtrl', [
        '$scope', '$timeout', '$location', '$log', '$routeParams', '$mdSidenav', 'User',
        function( $scope, $timeout, $location, $log, $routeParams, $mdSidenav, User ) {
            $log.log( "loaded problemsCtrl ..." );

            $scope.mathQuestions   = [];
            $scope.problemSettings = {
                initDone: false,
                selectedDomain: $routeParams.domain || '',
                tab: $routeParams.tab || 'arrays',
            };

            //------- start experimental Math editor MathQuill ------//
            $scope.mathEditor = {
                MQ: MathQuill.getInterface(2),
            };

            if ( $routeParams.domain ) {
                User.getMathProblems( $routeParams.domain, function( resp ) { // get problem sets
                    if ( resp.data ) {
                        $scope.mathQuestions = resp.data;
                    }
                });
            }
            
            $scope.toggleAnswerElem = function( qIndex, aIndex ) {
                var answer = $scope.mathQuestions[qIndex].answer[aIndex];
                if ( 'field' in answer ) {
                    answer.static = answer.field;
                    delete answer.field;
                } else if ( 'static' in answer ) {
                    answer.field = answer.static;
                    delete answer.static;
                }
            };

            $scope.addAnswerElem = function( qIndex, aIndex ) {
                $timeout( function() {
                    var answer   = $scope.mathQuestions[qIndex].answer;
                    var nextText = "x";
                    if ( answer.length > 0 ) {
                        var lAnswer = answer[answer.length - 1];
                        if ( 'text' in lAnswer ) nextText = lAnswer.text;
                        else if ( 'static' in lAnswer ) nextText = lAnswer.static;
                        else if ( 'field' in lAnswer )  nextText = lAnswer.field;
                    }
                    $scope.mathQuestions[qIndex].answer.push( { field: nextText } );
                });
            };

            $scope.deleteAnswerElem = function( qIndex, aIndex ) {
                $timeout( function() {
                    $scope.mathQuestions[qIndex].answer.splice( aIndex, 1 );
                });
            };
            
            //-------  end  experimental Math editor MathQuill ------//

            $scope.changeTab = function( tab ) {
                $scope.problemSettings.tab = tab;
            };

            $scope.selectDomain = function( domain ) {
                $scope.mathQuestions   = [];
                $scope.problemSettings.selectedDomain = domain;
                domain = domain.replace( /\s+/g, "" );
                User.getMathProblems( domain, function( resp ) { // get problem sets
                    if ( resp.data ) {
                        $scope.mathQuestions = resp.data;
                    }
                });
            };
	}
    ]);

})(window, window.angular);
