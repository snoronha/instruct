(function (window, angular, undefined) {

    angular.module( 'coderControllers' ).controller( 'editorCtrl', [
        '$scope', '$timeout', '$location', '$log', '$routeParams', '$mdSidenav', 'User',
        function( $scope, $timeout, $location, $log, $routeParams, $mdSidenav, User ) {
            $log.log( "loaded editorCtrl ..." );

            $scope.streams = {
                editor: null,
                stdout: null,
            };
            $scope.editorSettings = {
                initDone: false,
                busy: false,
                editor: 'text',
                language: 'javascript',
                tab: $routeParams.tab || 'Problem',
                problem_number: $routeParams.problem_number || null,
                problem: null,
            };
            
            if ( $routeParams.problem_number ) { // Get problem definition
                User.getProblem( $routeParams.problem_number, function( resp ) {
                    if ( resp.data ) {
                        $scope.editorSettings.problem = resp.data;
                    }
                });
            }

            $scope.changeTab = function( tab ) {
                $scope.editorSettings.tab = tab;
                // $location.path( '/editor/' + tab );
            };
            
            $scope.initEditor = function() {
                if ( $scope.editorSettings.initDone ) {
                    return;
                }
                $log.log( "Init editor!" );
                $scope.editorSettings.initDone = true;
            
                // Init ACE editor
                $scope.streams.editor = ace.edit( "editor" );
                $scope.streams.editor.setTheme( "ace/theme/chrome" );
                $scope.streams.editor.setKeyboardHandler( "ace/keyboard/" + $scope.editorSettings.editor );
                $scope.streams.editor.session.setMode( "ace/mode/" + $scope.editorSettings.language );
                $scope.streams.editor.setOptions({
                    minLines: 10,
                    maxLines: 50,
                    showPrintMargin: false,
                });
                $scope.streams.editor.$blockScrolling = Infinity;
                if ( $scope.editorSettings.problem_number ) {
                    $scope.streams.editor.setValue( User.getSetupCode( $scope.editorSettings.language )
                                                    .map( function(a) { return a.code; }).join( "\n" ));
                    $scope.setSelection( $scope.streams.editor, $scope.streams.editor.getCursorPosition() );
                }
                
                // Init ACE stdout
                $scope.streams.stdout = ace.edit( "stdout" );
                $scope.streams.stdout.setTheme( "ace/theme/chrome" );
                $scope.streams.stdout.session.setMode( "ace/mode/text" );
                $scope.streams.stdout.setOptions({
                    readOnly: true,
                    showGutter: false,
                    minLines: 5,
                    maxLines: 30,
                    showPrintMargin: false,
                    highlightActiveLine: false,
                    
                });
                $scope.streams.stdout.$blockScrolling = Infinity;
                $scope.streams.stdout.on( 'changeSelection', function(e) {
                    $scope.setSelection( $scope.streams.stdout, $scope.streams.stdout.getCursorPosition() );
                });
            };

            $scope.submitCode = function() {
                var codeSnippet = $scope.streams.editor.getValue();
                $scope.editorSettings.busy = true;
                $scope.streams.stdout.setValue( "" );
                User.executeScript( 
                    codeSnippet, $scope.editorSettings.problem, $scope.editorSettings.language,
                    function( scriptReturn ) {
                        $scope.streams.stdout.setValue( scriptReturn.message );
                        // $scope.streams.editor.focus();
                        $scope.editorSettings.busy = false;
                        if ( $scope.editorSettings.problem &&
                             $scope.editorSettings.problem.output == scriptReturn.message.trim() ) {
                            $log.log( "YAY! Output Matched!" );
                        }
                    },
                    function( scriptErr ) {
                        $scope.streams.stdout.setValue( scriptErr );
                        // $scope.streams.editor.focus();
                        $scope.editorSettings.busy = false;
                    }
                );
            };
                
            $scope.setEditor = function( editorName ) {
                $scope.editorSettings.editor = editorName;
                $scope.streams.editor.setKeyboardHandler( "ace/keyboard/" + editorName );
                $scope.streams.editor.focus();
            };
                
            $scope.setLanguage = function( language ) {
                $scope.editorSettings.language = language;
                $scope.streams.editor.session.setMode( "ace/mode/" + User.getLanguageMode( language ));
                $scope.streams.editor.focus();
                if ( $scope.editorSettings.problem_number ) {
                    $scope.streams.editor.setValue( User.getSetupCode( $scope.editorSettings.language )
                                                    .map( function(a) { return a.code; }).join( "\n" ));
                    $scope.setSelection( $scope.streams.editor, $scope.streams.editor.getCursorPosition() );
                }
            };
            
            $scope.setSelection = function( stream, cursorPosition ) {
                stream.selection.setSelectionRange({
                    start: { row: cursorPosition.row, column: cursorPosition.column },
                    end:   { row: cursorPosition.row, column: cursorPosition.column },
                });
            };

            $scope.sampleAction = function( name, ev ) {
                $log.log( "HERE: ", name );
            };





            $scope.openRight = function() {
                if ( ! $scope.isOpenRight()) {
                    $scope.toggleRight();
                }
            };
            $scope.toggleRight = buildToggler('right');
            $scope.isOpenRight = function(){
                return $mdSidenav( 'right' ).isOpen();
            };
            /**
             * Supplies a function that will continue to operate until the
             * time is up.
             */
            function debounce(func, wait, context) {
                var timer;
                return function debounced() {
                    var context = $scope,
                        args = Array.prototype.slice.call(arguments);
                    $timeout.cancel(timer);
                    timer = $timeout(function() {
                        timer = undefined;
                        func.apply(context, args);
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

})(window, window.angular);
