(function (window, angular, undefined) {

    angular.module( 'coderServices').service( 'User', [
        '$mdDialog', '$http', '$log', 'Cookie',
        function( $mdDialog, $http, $log, Cookie ) {

            var that = this;

            this.showAlert = function( popupContainer, title, text ) {
                $mdDialog.show(
                    $mdDialog.alert()
                        .parent(angular.element(document.querySelector( popupContainer )))
                        .clickOutsideToClose( true )
                        .title( title )
                        .textContent( text )
                        .ariaLabel( 'Alert Dialog Demo' )
                        .ok( 'OK!' )
                        // .targetEvent(ev)
                );
            };
            
            this.authUser = function( user, success, failure ) {
                if ( ! user.email_address ) {
                    // bootbox.alert( "Please enter an email address." );
                    return;
                }
                if ( ! user.password ) {
                    // bootbox.alert( "Please enter a password." );
                    return;
                }

                // Data looks good, attempt to auth
                var url     = '/api/api.php';
                user.action = 'authUser';
                $http({
                    method: 'POST',
                    url: url,
                    data: user,
                    paramSerializer: '$httpParamSerializerJQLike',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success( function( data, status, headers, config ) {
                    if ( angular.isFunction( success )) {
                        success( data );
                    }
                }).error( function( data, status, headers, config ) {
                    if ( angular.isFunction( failure )) {
                        failure( data );
                    }
                });
            };

            this.insertUser = function( user, popupContainer, success, failure ) {
                if ( ! user.email_address ) {
                    this.showAlert( popupContainer, "Registration Error", "Please enter an email address" );
                    return;
                }
                if ( ! user.password ) {
                    this.showAlert( popupContainer, "Registration Error", "Please enter a password" );
                    return;
                }
                if ( ! user.repeat_password ) {
                    this.showAlert( popupContainer, "Registration Error", "Please re-enter your password" );
                    return;
                }
                if ( user.password !== user.repeat_password ) {
                    this.showAlert( popupContainer, "Registration Error", "Please make sure your passwords match." );
                    return;
                }
                delete user.repeat_password;

                // Data looks good, attempt to insert
                var url     = '/api/api.php';
                user.action = 'insertUser';
                $http({
                    method: 'POST',
                    url: url,
                    data: user,
                    paramSerializer: '$httpParamSerializerJQLike',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
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

            this.updateUser = function( user, success, failure ) {
                if ( ! user.full_name ) {
                    // bootbox.alert( "Please enter your full name." );
                    return;
                }
                if ( ! user.phone_number ) {
                    // bootbox.alert( "Please enter your phone number." );
                    return;
                }
                if ( ! user.dob ) {
                    // bootbox.alert( "Please re-enter your date of birth." );
                    return;
                }
                that.updateUserToServer( user, success, failure );
            };
            
            this.updateUserToServer = function( user, success, failure ) {
                // Data looks good, attempt to update
                var url     = '/api/api.php';
                user.action = 'updateUser';
                $http({
                    method: 'POST',
                    url: url,
                    data: $.param( user ),
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
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
            
            // Same as updateUserToServer, but server needs to know to create Stripe customer
            this.createStripeCustomer = function( user, success, failure ) {
                // Data looks good, attempt to update
                var url     = '/api/api.php';
                user.action = 'createStripeCustomer';
                $http({
                    method: 'POST',
                    url: url,
                    data: $.param( user ),
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
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

            this.getPaymentDetails = function( user, success, failure ) {
                var url     = '/api/api.php';
                user.action = 'getPaymentDetails';
                $http({
                    method: 'POST',
                    url: url,
                    data: $.param( user ),
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success( function( data, status, headers, config ) {
                    if ( angular.isFunction( success )) {
                        success( data );
                    }
                }).error( function( data, status, headers, config ) {
                    if ( angular.isFunction( failure )) {
                        failure( data );
                    }
                });
            };

            this.chargeCustomer = function( user, success, failure ) {
                var url     = '/api/api.php';
                user.action = 'chargeCustomer';
                $http({
                    method: 'POST',
                    url: url,
                    data: $.param( user ),
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success( function( data, status, headers, config ) {
                    if ( angular.isFunction( success )) {
                        success( data );
                    }
                }).error( function( data, status, headers, config ) {
                    if ( angular.isFunction( failure )) {
                        failure( data );
                    }
                });
            };

            this.loginUser = function( data ) {
                var id = data['_id']['$id'];
                if ( id ) {
                    Cookie.setCookie( 'id', id );
                }
            };

            this.logoutUser = function() {
                Cookie.deleteCookie( 'id' );
            };

            this.getUserid = function() {
                return Cookie.getCookie( 'id' );
            };

            this.executeScript = function( codeSnippet, problem, language, success, failure ) {
                if ( ! codeSnippet || ! language ) {
                    if ( angular.isFunction( failure )) {
                        failure( "No code/language detected. Please submit code and choose language." );
                        return;
                    }
                }
                var url     = '/v1/users/exec_script'; // Code snippet exists, attempt to execute
                $http({
                    method: 'POST',
                    url: url,
                    data: { script: codeSnippet, language: language, problem: problem },
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

            this.getProblem = function( problem_number, successCallback, errorCallback ) {
                var url = '/v1/users/problem/' + problem_number;
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

            this.getMathProblems = function( domain, successCallback, errorCallback ) {
                var url = '/v1/users/math_problems/' + domain;
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

            this.getSetupCode = function( language ) {
                var setup = {
                    javascript: [
                        { code: "process.stdin.resume();", comment: null },
                        { code: "process.stdin.setEncoding('ascii');", comment: "Set ASCII encoding" },
                        { code: "" },
                        { code: 'var input_stdin = "", input_stdin_array = "", input_currentline = 0;' },
                        { code: "" },
                        { code: "process.stdin.on('data', function (data) { input_stdin += data; });" },
                        { code: "" },
                        { code: "process.stdin.on('end', function () {" },
                        { code: '    input_stdin_array = input_stdin.split("\\n");' },
                        { code: "    main();" },
                        { code: "});" },
                        { code: "" },
                        { code: "function readLine() {" },
                        { code: "    return input_stdin_array[input_currentline++];" },
                        { code: "}" },
                        { code: "" },
                        { code: "/////////////// ignore above this line ////////////////////" },
                        { code: "" },
                        { code: "function main() {" },
                        { code: "    // write your code here." },
                        { code: "    // use readLine() to read a line, console.log() to write to stdout" },
                        { code: "" },
                        { code: "    var n = parseInt(readLine());" },
                        { code: "}" }
                    ],
                    ruby: [
                        { code: "n = gets.strip.to_i" },
                    ],
                    'c++': [
                        { code: "#include <cmath>" },
                        { code: "#include <cstdio>" },
                        { code: "#include <vector>" },
                        { code: "#include <iostream>" },
                        { code: "#include <algorithm>" },
                        { code: "using namespace std;" },
                        { code: "" },
                        { code: "" },
                        { code: "int main() {" },
                        { code: "    /* Enter your code here. Read input from STDIN. Print output to STDOUT */" },
                        { code: "    return 0;" },
                        { code: "}" },
                    ],
                    php: [
                        { code: "<?php" },
                        { code: '$handle = fopen ( "php://stdin", "r" );' },
                        { code: "// To read a single integer into $n: " },
                        { code: 'fscanf( $handle, "%d", $n );' },
                        { code: "" },
                        { code: "// To read an array of integers from space-delimited input: " },
                        { code: "// $arr_temp = fgets( $handle );" },
                        { code: '// $arr = explode( " ",$arr_temp );' },
                        { code: "// array_walk( $arr, 'intval' );" },
                        { code: "" },
                        { code: "?>" },
                    ],
                    python: [
                        { code: "import sys" },
                        { code: "" },
                        { code: "# read in a single integer" },
                        { code: "n = int(raw_input().strip())" },
                        { code: "# read in an array of integers" },
                        { code: "# arr = map(int,raw_input().strip().split(' '))" },
                    ],
                };
                if ( setup[language] ) {
                    return setup[language];
                } else {
                    return [];
                }
            };

            this.getLanguageMode = function( language ) {
                var mode = {
                    javascript: 'javascript',
                    ruby:       'ruby',
                    'c++':      'c_cpp',
                    php:        'php',
                    python:     'python',
                };
                if ( mode[language] ) {
                    return mode[language];
                } else {
                    return "javascript";
                }
            };
        }
    ]);

})(window, window.angular);
