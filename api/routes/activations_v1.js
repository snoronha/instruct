var express  = require('express');
var router   = express.Router();
var fetch    = require('node-fetch');

var Util     = require('../helpers/util.js');

// GET activations by filter criteria
router.get( '/', function( req, res, next ) {
    var privEndpoint = req.originalUrl.replace( "activations", "activations_priv" );
    var url = Util.getPrivateAPIUrl( privEndpoint );
    fetch( url )
        .then( function( actPriv ) { return actPriv.json(); })
        .then( function( actJson ) { return res.send( actJson ); })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return { error: err }; });
});

// GET manager activations by code
router.get( '/manager/:code', function( req, res, next ) {
    var code = req.params.code;
    if ( ! code ) {
        console.log( "No code specified: ", req.params );
        return res.send({ error: 'No code specified' });
    }
    var url = Util.getPrivateAPIUrl( '/v1/activations_priv/?code=' + code );
    fetch( url )
        .then( function( actPriv ) { return actPriv.json(); })
        .then( function( actJson ) {
            if ( actJson.length <= 0 ) {
                console.log( "No user found for code: " + code );
                return res.send({ error: 'No user found' });
            }
            var userBlob = actJson[0];
            // See if this user is a manager
            url = Util.getPrivateAPIUrl( '/v1/store_users_priv/?s.userid=' + userBlob.userid + '&r.type=MANAGER' );
            fetch( url )
                .then( function( storePriv ) { return storePriv.json(); })
                .then( function( storeJson ) {
                    if ( storeJson.length <= 0 ) {
                        return res.send({ error: "User found but is not a manager"});
                    }
                    userBlob.store_id = storeJson[0].store_id;
                    return res.send( userBlob );
                })
                .catch( function( err ) {
                    console.log( "No store found: ", userBlob );
                    return res.send({ error: err });
                });
        })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return res.send({ error: err }); });
});

// GET helper activations by code
router.get( '/helper/:code', function( req, res, next ) {
    var code = req.params.code;
    if ( ! code ) {
        console.log( "No code specified: ", req.params );
        return res.send({ error: 'No code specified' });
    }
    var url = Util.getPrivateAPIUrl( '/v1/activations_priv/?code=' + code );
    fetch( url )
        .then( function( actPriv ) { return actPriv.json(); })
        .then( function( actJson ) {
            if ( actJson.length <= 0 ) {
                console.log( "No user found for code: " + code );
                return res.send({ error: 'No user found' });
            }
            var userBlob = actJson[0];
            // See if this user is a helper
            url = Util.getPrivateAPIUrl( '/v1/store_users_priv/?s.userid=' + userBlob.userid + '&r.type=HELPER' );
            fetch( url )
                .then( function( storePriv ) { return storePriv.json(); })
                .then( function( storeJson ) {
                    if ( storeJson.length <= 0 ) {
                        return res.send({ error: "User found but is not a helper"});
                    }
                    return res.send( userBlob );
                })
                .catch( function( err ) {
                    console.log( "No store-user found: ", userBlob );
                    return res.send({ error: err });
                });
        })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return { error: err }; });
});

router.post( '/', function( req, res, next ) {
    var userid  = req.body.userid;
    if ( isNaN( userid ) ) {
        console.log( "Invalid input activation: ", req.body );
        return res.json( { error: 'Invalid activation request', message: req.body } );
    }
    var post_data  = { userid: userid };
    var url = Util.getPrivateAPIUrl( '/v1/activations_priv/' );
    fetch( url, { method: 'post', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                  body: JSON.stringify( post_data ) })
        .then( function( actPriv ) { return actPriv.json(); })
        .then( function( actJson ) { 
            var code = Util.dumbPermuteNumber( actJson.id, 99999 );
            url      = Util.getPrivateAPIUrl( '/v1/activations_priv/' + actJson.id );
            fetch( url, { method: 'put', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                          body: JSON.stringify({ code: code }) })
                .then( function( actUpdPriv ) { return actUpdPriv.json(); })
                .then( function( actUpdJson ) { 
                    if ( actUpdJson.length <= 0 ) {
                        res.send({ error: "No activation updated" });
                    }
                    return res.send( actUpdJson );
                })
                .catch( function( err ) { return res.send( { error: err } ); });
            
        })
        .catch( function( err ) { return res.send( { error: err } ); });
});

router.put( '/:id', function( req, res, next ) {
    var id       = req.params.id;
    var cols     = { 'userid': false, 'token': false, 'endpoint_arn': false }; 
    var put_data = {};

    if ( ! isNaN( id ) ) {
        for( var key in req.body ) {
            if ( key in cols ) {
                put_data[key] = req.body[key];
            }
        }

        if ( Object.keys( put_data ).length > 0 ) {
            var url = Util.getPrivateAPIUrl( '/v1/devices_priv/' + id );
            fetch( url, { method: 'put', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                          body: JSON.stringify( put_data ) })
                .then( function( devPriv ) {
                    return devPriv.json();
                })
                .then( function( devJson ) {
                    return res.send( devJson );
                })
                .catch( function( err ) {
                    console.log( "Fetch error: ", err );
                });
        } else {
            console.log( "No parameters to update device: ", req.body );
            return res.json( [] );
        }
    } else {
        console.log( "Invalid id for update device: ", req.body );
        return res.json( [] );
    }
});

module.exports = router;
