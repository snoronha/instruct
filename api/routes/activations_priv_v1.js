var express  = require('express');
var router   = express.Router();
var pg       = require('pg');
var Util     = require('../helpers/util.js');

var userDB   = process.env.DATABASE_URL || Util.getDBConnectionString( 'userDB' );

// GET activation codes by filter criteria
router.get( '/', function( req, res, next ) {
    var cols  = { 'id': false, 'code': false, 'userid': false };
    var where = Util.getWhereClauseFromParams( req.query, cols ); 
    var whereClause = where.whereClause, paramIndex = where.paramIndex, params = where.params;
    if ( whereClause.length <= 0 ) {
        console.log( "No parameters to search for in activation: ", req.body );
        return res.json( [] );
    }
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            return console.error( 'error fetching client from pool', err );
        }
        var sql = "SELECT id, userid, code \
                   FROM   activation \
                   WHERE " + whereClause;
        client.query( sql, params, function( err, result ) {
            done();
            if ( err ) {
                return res.json( { error: 'search activations', request: req.query } );
            } else {
                return res.json( result.rows );
            }
        });
    });
});

router.post( '/', function( req, res, next ) {
    var userid       = req.body.userid;

    if ( isNaN( userid ) ) {
        console.log( "Invalid userid: ", req.body );
        return res.json( { error: "Invalid activation code" } );
    }
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            console.log( 'error fetching client from pool', err );
            return res.json( err );
        }
        var sql = "INSERT into activation ( userid ) \
                   VALUES ( $1 ) \
                   RETURNING id, userid";
        client.query( sql, [userid], function( err, result ) {
            done();
            if ( err ) {
                console.log( 'error inserting into activation', err );
                return res.json( { error: "Error inserting activation" } );
            }
            return res.json( result.rows[0] );
        });
    });
});

router.put( '/:id', function( req, res, next ) {
    var id      = req.params.id;
    var cols    = { 'userid': false, 'code': false }; 
    if ( isNaN( id ) ) {
        console.log( "Invalid id for activation: ", req.body );
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
        console.log( "No parameters to update in activation: ", req.body );
        return res.json( [] );     
    }
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            return console.error( 'error fetching client from pool', err );
        }
        var sql = "UPDATE activation SET " + upClause + " WHERE id = " + id + " RETURNING id, code, userid";
        client.query( sql, params, function( err, result ) {
            done();
            if ( err ) {
                return console.error( 'error posting activation', err );
            } else {
                return res.json( result.rows );
            }
        });
    });
});

module.exports = router;
