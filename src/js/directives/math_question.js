(function (window, angular, undefined) {

    angular.module('coderDirectives').directive( 'mathStatic', [ '$log', '$timeout', function( $log, $timeout ) {
        return {
            restrict: "E",
            template: "<span></span>",
            link: function( scope, element, attrs ) {
                var qStatic = attrs.staticText ? attrs.staticText : "";
                if ( qStatic ) {
                    angular.element( element ).html( qStatic );
                    var mathField = scope.mathEditor.MQ.StaticMath( element[0] );
                    mathField.reflow();
                }
            }
        };
    }]);

    angular.module('coderDirectives').directive( 'mathField', [ '$log', '$timeout', function( $log, $timeout ) {
        return {
            restrict: "E",
            template: "<span></span>",
            link: function( scope, element, attrs ) {
                var questionId = attrs.questionId, answerId = attrs.answerId;
                var aField  = attrs.fieldText ? attrs.fieldText : "";
                if ( aField ) {
                    angular.element( element ).html( aField );
                }
                var currStr = "";
                var mathField = scope.mathEditor.MQ.MathField( element[0], {
                    handlers: {
                        edit: function( mathField ) {
                            var str = mathField.latex();
                            scope.mathQuestions[questionId].answer[answerId].field = str;
                            if ( str.length > currStr.length ) {
                                var diff = str.length - currStr.length;
                                var addChars = str.substr( str.length - diff, str.length - 1 );
                                $log.log( str );
                            } else {
                                $log.log( "Other: " + mathField.latex() );
                            }
                            currStr = str;
                        },
                        enter: function( mathField ) {
                            $timeout( function() {
                                scope.toggleAnswerElem( questionId, answerId );
                                if ( answerId >= scope.mathQuestions[questionId].answer.length - 1 ) {
                                    scope.addAnswerElem( questionId, answerId );
                                }
                            });
                        },
                        downOutOf: function( mathField ) {
                            $log.log( "Down Out Of ... " );
                        },
                    }
                });
                mathField.reflow();
                
            }
        };
    }]);

})(window, window.angular);
