var express  = require('express');
var router   = express.Router();
// var pg       = require('pg');
var Util     = require('../helpers/util.js');

var messageDB   = process.env.DATABASE_URL || Util.getDBConnectionString( 'messageDB' );

// GET messages by filter criteria
router.get( '/', function( req, res, next ) {
    var cols    = { 'id': false, 'to_userid': false, 'status': false, 'type': false };
    var whereClause = "", paramIndex = 1, params = [];
    for ( var key in req.query ) {
        if ( key in cols ) {
            var val = req.body[key];
            if ( req.query[key] ) {
                var snippet = key + " = $" + paramIndex;
                whereClause += ( whereClause.length <= 0 ) ? snippet : " and " + snippet;
                params.push( req.query[key] );
                paramIndex++;
            }
        }
    }

    if ( whereClause.length > 0 ) {
        /*
        pg.connect( messageDB, function( err, client, done ) {
            if ( err ) {
                return console.error( 'error fetching client from pool', err );
            }
            var sql = "SELECT id, to_userid, type, data, status \
                       FROM   message \
                       WHERE " + whereClause;
            client.query( sql, params, function( err, result ) {
                done();
                if ( err ) {
                    return res.json( { error: 'search messages', request: req.query } );
                } else {
                    return res.json( result.rows );
                }
            });
        });
        */
    } else {
        console.log( "No parameters to search for in messages: ", req.body );
        return res.json( [] );
    }
});

router.post( '/', function( req, res, next ) {
    var to_userid  = req.body.to_userid;
    var client_app = req.body.client_app;
    var type       = req.body.type;
    var data       = req.body.data;
    var status     = req.body.status || 'READY';

    if ( isNaN( to_userid ) || ! client_app || ! data ) {
        console.log( "Invalid input message: ", req.body );
        return res.json( [] );
    }
    /*
    pg.connect( messageDB, function( err, client, done ) {
        if ( err ) {
            return console.error( 'error fetching client from pool', err );
        }
        var sql = "INSERT into message ( to_userid, client_app, type, data, status ) \
                   VALUES ( $1, $2, $3, $4, $5 ) \
                   RETURNING id, to_userid, client_app, type";
        client.query( sql, [to_userid, client_app, type, data, status], function( err, result ) {
            done();
            if ( err ) {
                return console.error( 'error posting message', err );
            } else {
                return res.json( result.rows );
            }
        });
    });
    */
});

router.put( '/:id', function( req, res, next ) {
    var id      = req.params.id;
    var cols    = { 'to_userid': false, 'client_app': false, 'data': false, 'status': false, 'type': false }; 
    if ( isNaN( id ) ) {
        console.log( "Invalid id for message: ", req.body );
        return res.json( [] );
    }
    var upClause = "", paramIndex = 1, params = [];
    // iterate through body to construct update clause
    for( var key in req.body ) {
        if ( key in cols ) {
            var val = req.body[key];
            if ( val ) {
                var snippet = key + " = $" + paramIndex;
                upClause += ( upClause.length <= 0 ) ? snippet : ", " + snippet;
                params.push( val );
                paramIndex++;
            }
        }
    }

    // Added updated_at if any fields being updated
    upClause += ( upClause.length <= 0 ) ? "" : ", updated_at = now()";

    if ( upClause.length <= 0 ) {
        console.log( "No parameters to update in message: ", req.body );
        return res.json( [] );
    }
    /*
    pg.connect( messageDB, function( err, client, done ) {
        if ( err ) {
            return console.error( 'error fetching client from pool', err );
        }
        var sql = "UPDATE message SET " + upClause + " WHERE id = " + id + " RETURNING id";
        client.query( sql, params, function( err, result ) {
            done();
            if ( err ) {
                return console.error( 'error posting message', err );
            } else {
                return res.json( result.rows );
            }
        });
    });
    */
});

module.exports = router;
