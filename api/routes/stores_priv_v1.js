var express  = require('express');
var router   = express.Router();
var pg       = require('pg');
var Util     = require('../helpers/util.js');

var userDB   = process.env.DATABASE_URL || Util.getDBConnectionString( 'userDB' );

// GET stores by filter criteria
router.get( '/', function( req, res, next ) {
    var cols        = { id: 'equal', name: 'like', city: 'like', state: 'equal' };
    var where       = Util.getWhereClauseFromParams( req.query, cols ); 
    var whereClause = where.whereClause, paramIndex = where.paramIndex, params = where.params;
    if ( whereClause.length <= 0 ) {
        console.log( "Error in search for stores: ", req.body );
        return res.json( [] );
    }
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            return console.error( 'error fetching client from pool', err );
        }
        var sql = "SELECT id, name, address, city, roles, concept, lng, lat, type \
                   FROM   store \
                   WHERE " + whereClause;
        client.query( sql, params, function( err, result ) {
            done();
            if ( err ) {
                return res.json( { error: 'search stores', request: req.query } );
            } else {
                return res.json( result.rows );
            }
        });
    });
});

/* GET store by ID */
router.get( '/:id', function( req, res, next ) {
    var id      = req.params.id;
    var results = [];
    
    if ( ! isNaN( id )) {
        pg.connect( userDB, function( err, client, done ) {
            if ( err ) {
                return console.error( 'error fetching client from pool', err );
            }
            var sql   = "SELECT id, name, address, city, roles, lng, lat, concept, type FROM store WHERE id = $1";
            client.query( sql, [ id ], function( err, result ) {
                done();
                if ( err ) {
                    return console.error( 'error fetching client from pool', err );
                } else {
                    return res.json( result.rows );
                }
            });
        });
    } else {
	console.log( "Invalid input id=" + id );
        return res.json( results );
    }
});

/* GET stores by lng/lat. */
router.get( '/:lng/:lat', function( req, res, next ) {
    var lng     = req.params.lng;
    var lat     = req.params.lat;
    var results = [];
    
    if ( ! isNaN( lng ) && ! isNaN( lat )) {

        pg.connect( userDB, function( err, client, done ) {
            var sql = "SELECT id, name, address, city, roles, lng, lat, concept, type FROM store \
                       WHERE  sqrt( (lng - " + lng + " ) * (lng - " + lng + " ) + \
                                    (lat - " + lat + " ) * (lat - " + lat + " ) ) < 0.1 \
                       LIMIT  50 OFFSET 0";
            client.query( sql, function( err, result ) {
                done();
                if ( err ) {
                    return console.error( 'error executing get stores: ', err );
                } else {
                    return res.json( result.rows );
                }
            });
        });
    } else {
	console.log( "Invalid input lng=" + lng + " lat=" + lat );
        return res.json( results );
    }
});

module.exports = router;
