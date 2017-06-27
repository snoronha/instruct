var express  = require('express');
var router   = express.Router();
var pg       = require('pg');
var sql      = require('sql');

var Util     = require('../helpers/util.js');

var userDB   = process.env.DATABASE_URL || Util.getDBConnectionString( 'userDB' );

// GET store_users by filter criteria
router.get( '/', function( req, res, next ) {
    var cols        = { 's.id': false, 's.store_id': false, 's.userid': false, 's.role_id': false,
                        'r.name': false, 'r.concept': false, 'r.type': false };
    var where       = Util.getWhereClauseFromParams( req.query, cols ); 
    var whereClause = where.whereClause, paramIndex = where.paramIndex, params = where.params;
    if ( whereClause.length <= 0 ) {
        console.log( "Error in search for store_users: ", req.body );
        return res.json( [] );
    }
    whereClause     += " and s.role_id = r.id";
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            return console.error( 'error fetching client from pool', err );
        }
        var sql_query = "SELECT s.id, s.store_id, s.userid, s.role_id, r.name, r.concept, r.type \
                         FROM   store_users s, role r \
                         WHERE " + whereClause;
        client.query( sql_query, params, function( err, result ) {
            done();
            if ( err ) {
                return res.json( { error: 'search store_users', request: req.query } );
            } else {
                return res.json( result.rows );
            }
        });
    });
});

router.post( '/', function( req, res, next ) {
    var store_id = req.body.store_id;
    var userid   = req.body.userid;
    var role_id  = req.body.role_id || "";
    
    if ( isNaN( store_id ) || isNaN( userid ) || isNaN( role_id ) ) {
        console.log( "Invalid input store_user: ", req.body );
        return res.json( [] );
    }
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            return console.error( 'error fetching client from pool', err );
        }
        var sql_query = "INSERT   into store_users \
                                ( store_id, userid, role_id ) \
                         VALUES ( $1, $2, $3 ) \
                         RETURNING id, store_id, userid, role_id";
        client.query(
            sql_query, [store_id, userid, role_id], function( err, result ) {
                done();
                if ( err ) {
                    return console.error( 'error posting store_user', err );
                } else {
                    return res.json( result.rows );
                }
            });
    });
});

router.put( '/', function( req, res, next ) {
    var upcols      = { 'store_id': false, 'userid': false, 'role_id': false };
    var wherecols   = { 'id': false, 'store_id': false, 'userid': false };
    var up          = Util.getUpdateClauseFromParams( req.body, upcols );
    var upClause    = up.upClause; var paramIndex = up.paramIndex; var upParams = up.params;
    var where       = Util.getWhereClauseFromParams( req.query, wherecols, paramIndex );
    var whereClause = where.whereClause; paramIndex = where.paramIndex; var whereParams = where.params;
    var params      = upParams.concat( whereParams );
    if ( whereClause.length <= 0 ) {
        console.log( "Error in search for store_users: ", req.query );
        return res.json( [] );
    }

    if ( upClause.length <= 0 ) {
        console.log( "No parameters to update in store_user: ", req.body );
        return res.json( [] );
    }
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            return console.error( 'error fetching client from pool', err );
        }

        var sql_query = "UPDATE store_users SET " + upClause + " WHERE " + whereClause + " \
                         RETURNING id, store_id, userid, role_id";
        client.query( sql_query, params, function( err, result ) {
            done();
            if ( err ) {
                return console.error( 'error posting store_user', err );
            } else {
                return res.json( result.rows );
            }
        });
    });
});

module.exports = router;
