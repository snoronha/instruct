(function (window, angular, undefined) {

    angular.module('coderControllers').controller('paymentInfoCtrl', [
        '$scope', '$location', '$routeParams', '$log', 'User',
        function( $scope, $location, $routeParams, $log, User ) {

            $log.log( "loaded paymentInfoCtrl ..." );
            $scope.config  = {
                isLoggedIn: User.getUserid() ? true : false,
            };
            $scope.user    = {};
            $scope.user.id = User.getUserid();

            Stripe.setPublishableKey('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

            $('#payment-form').submit( function( event ) {
                var $form = $(this);
                // Disable the submit button to prevent repeated clicks
                $form.find('button').prop('disabled', true);
                Stripe.card.createToken($form, stripeResponseHandler);
                // Prevent the form from submitting with the default action
                return false;
            });

            function stripeResponseHandler(status, response) {
                var $form = $('#payment-form');
                if ( response.error ) {
                    // Show the errors on the form
                    bootbox.alert( response.error.message );
                    $form.find('button').prop('disabled', false);
                } else {
                    // response contains id and card, which contains additional card details
                    var token = response.id;
                    var user  = { payment_details: response, id: User.getUserid() };
                    User.createStripeCustomer( 
                        user,
                        function( data ) {
                            User.getPaymentDetails(
                                user,
                                function( data ) {
                                    $log.log( "payment details: ", data );
                                },
                                function( data ) {
                                    
                                }
                            );
                            User.chargeCustomer(
                                user,
                                function( data ) {
                                    bootbox.alert( "You have been charged!" );
                                    $location.path( '/home' );
                                },
                                function( data ) {
                                    $log.log( "Error charging customer: ", data );
                                }
                            );

                        },
                        function( data ) {
                            $log.log( "Update user error" );
                            bootbox.alert( data.message );
                        }
                    );
                }
            };

	    }
    ]);

})(window, window.angular);

