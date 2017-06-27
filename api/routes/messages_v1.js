var express  = require('express');
var router   = express.Router();
var fetch    = require('node-fetch');

var Util     = require('../helpers/util.js');

// GET messages by filter criteria
router.get( '/', function( req, res, next ) {
    var query   = req.query;
    
    var privEndpoint = req.originalUrl.replace( "messages", "messages_priv" );

    var url = Util.getPrivateAPIUrl( privEndpoint );
    fetch( url )
        .then( function( msgPriv ) {
            return msgPriv.json();
        })
        .then( function( msgJson ) {
            return res.send( msgJson );
        })
        .catch( function( err ) {
            console.log( "Fetch error: ", err );
        });
});

router.post( '/', function( req, res, next ) {
    var to_userid  = req.body.to_userid;
    var client_app = req.body.client_app;
    var type       = req.body.type;
    var data       = req.body.data;
    var status     = req.body.status || 'READY';
    var post_data  = {
        to_userid: to_userid,
        client_app: client_app,
        type: type,
        data: data,
        status: status,
    };

    if ( isNaN( to_userid ) || ! client_app || ! data ) {
        console.log( "Invalid input message: ", req.body );
        return res.json( { error: 'Invalid message request', message: req.body } );
    }
    var url = Util.getPrivateAPIUrl( '/v1/messages_priv/' );
    fetch( url, { method: 'post', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                  body: JSON.stringify( post_data ) })
        .then( function( msgPriv ) {
            return msgPriv.json();
        })
        .then( function( msgJson ) {
            return res.send( msgJson );
        })
        .catch( function( err ) {
            return res.json( { error: err } );
        });
});

router.put( '/:id', function( req, res, next ) {
    var id       = req.params.id;
    var cols     = { 'to_userid': false, 'client_app': false, 'data': false, 'status': false, 'type': false }; 
    var put_data = {};

    if ( ! isNaN( id ) ) {
        for( var key in req.body ) {
            if ( key in cols ) {
                put_data[key] = req.body[key];
            }
        }

        if ( Object.keys( put_data ).length > 0 ) {
            var url = Util.getPrivateAPIUrl( '/v1/messages_priv/' + id );
            fetch( url, { method: 'put', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                          body: JSON.stringify( put_data ) })
                .then( function( msgPriv ) {
                    return msgPriv.json();
                })
                .then( function( msgJson ) {
                    return res.send( msgJson );
                })
                .catch( function( err ) {
                    console.log( "Fetch error: ", err );
                });
        } else {
            console.log( "No parameters to update message: ", req.body );
            return res.json( [] );
        }
    } else {
        console.log( "Invalid id for update message: ", req.body );
        return res.json( [] );
    }
});

module.exports = router;
