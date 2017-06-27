var express  = require('express');
var router   = express.Router();
var fetch    = require('node-fetch');

var Util     = require('../helpers/util.js');

// GET sessions by session_id
router.get( '/:session_id', function( req, res, next ) {
    var session_id = req.params.session_id;
    if ( ! session_id ) {
        console.log( "Invalid session id: " + session_id );
        return res.json( { error: "Invalid session id=" + session_id } );
    }
    var url = Util.getPrivateAPIUrl( '/v1/sessions_priv/' + session_id );
    fetch( url )
        .then( function( sessPriv ) { return sessPriv.json(); })
        .then( function( sessJson ) {
            if ( sessJson.length <= 0 ) {
                return res.json( { error: "No session found: " + session_id } );
            }
            return res.send( sessJson[0] );
        })
        .catch( function( err ) {
            console.log( "Fetch /v1/sessions/:session_id error: ", err );
            return res.send({ error: err } );
        });
});

router.post( '/', function( req, res, next ) {
    var activation_code = req.body.activation_code;
    var phone           = req.body.phone;

    if ( isNaN( activation_code ) || isNaN( phone ) ) {
        console.log( "Session post - activation_code and phone required: ", req.body );
        return res.json( { error: 'Invalid session creation request', message: req.body } );
    }
    // Get user for this activation code. Compare phone number from user and input
    var url = Util.getPrivateAPIUrl( '/v1/activations_priv/?code=' + activation_code );
    fetch( url )
        .then( function( actPriv ) { return actPriv.json(); })
        .then( function( actJson ) {
            if ( actJson.length <= 0 ) {
                res.send({ error: "Invalid activation code: " + activation_code});
            }
            var act = actJson[0];
            url     = Util.getPrivateAPIUrl( '/v1/users_priv/?id=' + act.userid );
            fetch( url )
                .then( function( userPriv ) { return userPriv.json(); })
                .then( function( userJson ) {
                    if ( userJson.length <= 0 ) {
                        res.send({ error: "No user found: userid=" + act.userid + " code=" + activation_code });
                    }
                    var user = userJson[0];
                    if ( user.phone_number == phone ) { // Success. Create session and return
                        var post_data  = { session_id: Util.randomValueHex( 24 ), userid: act.userid };
                        url = Util.getPrivateAPIUrl( '/v1/sessions_priv/' );
                        fetch( url, { method: 'post',
                                      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                                      body: JSON.stringify( post_data ) })
                            .then( function( sessPriv ) { return sessPriv.json(); })
                            .then( function( sessJson ) { return res.send( sessJson ); })
                            .catch( function( err ) { return res.send({ error: err }); });
                    } else {
                        res.send({ error: "Unable to authenticate with code=" + activation_code + " phone=" + phone });
                    }
                })
                .catch( function( err ) { return res.send({ error: err }); });
        })
        .catch( function( err ) { return res.send({ error: err }); });
});

module.exports = router;
