var express  = require('express');
var router   = express.Router();
var pg       = require('pg');
var Util     = require('../helpers/util.js');

var userDB   = process.env.DATABASE_URL || Util.getDBConnectionString( 'userDB' );

// GET sessions by session_id
router.get( '/:session_id', function( req, res, next ) {
    var session_id = req.params.session_id;
    
    if ( ! session_id ) {
        console.log( "Invalid input session id=" + session_id );
        return res.json( { error: "Invalid input session id=" + session_id } );
    }
    
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            return res.json({ error: err });
        }
        var sql = "SELECT session_id, userid, \
                          to_char( updated_at, 'mm/dd/yyyy hh24:mi:ss') as updated_at, \
                          to_char( created_at, 'mm/dd/yyyy hh24:mi:ss') as created_at \
                   FROM   session WHERE session_id = $1";
        client.query( sql, [session_id], function( err, result ) {
            done();
            if ( err ) {
                return res.json({ error: err });
            }
            return res.json( result.rows );
        });
    });

});

router.post( '/', function( req, res, next ) {
    var session_id   = req.body.session_id;
    var userid       = req.body.userid;
    
    if ( isNaN( userid ) || ! session_id ) {
        console.log( "Invalid input session: ", req.body );
        return res.json( { error: 'Invalid session request', message: req.body } );
    }
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            console.log( 'error fetching client from pool', err );
            return res.json({ error:  err });
        }
        var sql = "INSERT into session ( session_id, userid ) \
                   VALUES ( $1, $2 ) \
                   RETURNING session_id, userid, \
                             to_char( updated_at, 'mm/dd/yyyy hh24:mi:ss') as updated_at, \
                             to_char( created_at, 'mm/dd/yyyy hh24:mi:ss') as created_at";
        client.query( sql, [session_id, userid], function( err, result ) {
            done();
            if ( err ) {
                console.log( 'error inserting into session', err );
                return res.json( { error: "Error inserting session" } );
            }
            return res.json( result.rows[0] );
        });
    });
});

router.put( '/:id', function( req, res, next ) {
    var id      = req.params.id;
    var cols    = { 'userid': false, 'token': false, 'endpoint_arn': false }; 
    if ( ! isNaN( id ) ) {
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

        if ( upClause.length > 0 ) {
            pg.connect( userDB, function( err, client, done ) {
                if ( err ) {
                    return console.error( 'error fetching client from pool', err );
                }
                var sql = "UPDATE session SET " + upClause + " WHERE id = " + id + " \
                           RETURNING session_id, userid, \
                                     to_char( updated_at, 'mm/dd/yyyy hh24:mi:ss') as updated_at, \
                                     to_char( created_at, 'mm/dd/yyyy hh24:mi:ss') as created_at";
                client.query( sql, params, function( err, result ) {
                    done();
                    if ( err ) {
                        return console.error( 'error posting session', err );
                    } else {
                        return res.json( result.rows );
                    }
                });
            });
        } else {
            console.log( "No parameters to update in session: ", req.body );
            return res.json( [] );
        }
    } else {
        console.log( "Invalid id for session: ", req.body );
        return res.json( [] );
    }
});

module.exports = router;
