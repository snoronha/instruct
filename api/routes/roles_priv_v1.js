var express  = require('express');
var router   = express.Router();
var pg       = require('pg');
var Util     = require('../helpers/util.js');

var userDB   = process.env.DATABASE_URL || Util.getDBConnectionString( 'userDB' );

// GET roles by filter criteria
router.get( '/', function( req, res, next ) {
    var cols        = { id: 'equal', concept: 'equal' };
    var where       = Util.getWhereClauseFromParams( req.query, cols ); 
    var whereClause = where.whereClause, paramIndex = where.paramIndex, params = where.params;
    if ( whereClause.length <= 0 ) {
        console.log( "Error in search for roles: ", req.body );
        return res.json( [] );
    }
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            return console.error( 'error fetching client from pool', err );
        }
        var sql = "SELECT id, name, concept, type \
                   FROM   role \
                   WHERE " + whereClause;
        client.query( sql, params, function( err, result ) {
            done();
            if ( err ) {
                return res.json( { error: 'search roles', request: req.query } );
            } else {
                return res.json( result.rows );
            }
        });
    });
});

module.exports = router;
