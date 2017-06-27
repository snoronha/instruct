var express  = require('express');
var router   = express.Router();
var fetch    = require('node-fetch');

var Util     = require('../helpers/util.js');

// GET stores by filter criteria
router.get( '/', function( req, res, next ) {
    var privEndpoint = req.originalUrl.replace( "stores", "stores_priv" );
    var url = Util.getPrivateAPIUrl( privEndpoint );
    fetch( url )
        .then( function( storePriv ) { return storePriv.json(); })
        .then( function( storeJson ) { return res.send( storeJson ); })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json({ error: err }); });
});

/* GET store by ID */
router.get( '/:id', function( req, res, next ) {
    var id      = req.params.id;
    
    if ( ! isNaN( id )) {
        var url = Util.getPrivateAPIUrl( '/v1/stores_priv/' + id );
        fetch( url )
            .then( function( resPriv ) {
                return resPriv.json();
            })
            .then( function( json ) {
                return res.send( json );
            })
            .catch( function( err ) {
                console.log( "Fetch error: ", err );
            });
    } else {
	    console.log( "Invalid input id=" + id );
        return res.json( [] );
    }
});

/* GET stores by lng/lat. */
router.get( '/:lng/:lat', function( req, res, next ) {
    var lng     = req.params.lng;
    var lat     = req.params.lat;
    
    if ( ! isNaN( lng ) && ! isNaN( lat )) {
        var url = Util.getPrivateAPIUrl( '/v1/stores_priv/' + lng + '/' + lat );
        fetch( url )
            .then( function( resPriv ) {
                return resPriv.json();
            })
            .then( function( json ) {
                return res.send( json );
            })
            .catch( function( err ) {
                console.log( "Fetch error: ", err );
            });
    } else {
        console.log( "Invalid input lng=" + lng + " lat=" + lat );
        return res.json( [] );
    }
});

module.exports = router;
