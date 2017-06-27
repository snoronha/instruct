var express  = require('express');
var router   = express.Router();
var Util     = require('../helpers/util.js');

var userDB   = process.env.DATABASE_URL || Util.getDBConnectionString( 'userDB' );

// GET users by filter criteria
router.get( '/', function( req, res, next ) {
    /*
    AuthUtil.getAuthedUser( req.query.session_id, function( err, authJson ) {
        if ( ! err && authJson.length > 0 ) {
            var auth_userid = authJson[0].userid;
            if ( req.query.id && auth_userid !== parseInt( req.query.id )) {
                return res.json( [] );
            }
        }
    */
        
    var cols        = { id: 'equal', first_name: 'like', last_name: 'like' };
    var where       = Util.getWhereClauseFromParams( req.query, cols ); 
    var whereClause = where.whereClause, paramIndex = where.paramIndex, params = where.params;
    if ( whereClause.length <= 0 ) {
        console.log( "Error in search for users: ", req.body );
        return res.json( [] );
    }
    // });
    
});

router.post( '/', function( req, res, next ) {
    var phone_number = req.body.phone_number;
    var first_name   = req.body.first_name;
    var last_name    = req.body.last_name;
    var default_rate = req.body.default_rate;
    var image_url    = req.body.image_url;
    var lat          = req.body.lat;
    var lng          = req.body.lng;

    if ( ! phone_number || ! first_name || ! last_name || ! default_rate ) {
        console.log( "Invalid user: ", req.body );
        return res.json( { error: 'Invalid user request', message: req.body } );
    }
    /*
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            console.log( 'error fetching client from pool', err );
            return res.json( err );
        }
        var sql = "INSERT into users (phone_number, first_name, last_name, default_rate, image_url, lat, lng ) \
                   VALUES ( $1, $2, $3, $4, $5, $6, $7 ) \
                   RETURNING id, phone_number, first_name, last_name, default_rate, image_url, language, \
                             lat, lng, address, city, state";
        client.query(
            sql, [phone_number, first_name, last_name, default_rate, image_url, lat, lng],
            function( err, result ) {
                done();
                if ( err ) {
                    console.log( 'error inserting into users', err );
                    return res.json( { error: "Error inserting users" } );
                }
                return res.json( result.rows[0] );
            });
    });
    */
});

router.post( '/exec_script', function( req, res, next ) {
    var script     = req.body.script;
    var language   = req.body.language;
    var problem    = req.body.problem;
    if ( ! script || ! language ) {
        console.log( "Invalid script: ", req.body );
        return res.json( { error: 'Invalid script exec request', message: req.body } );
    }

    var scriptReturn = Util.execCmd( script, problem, language );
    if ( scriptReturn.status === 0 ) {
        var err = scriptReturn.error;
        if ( ! err ) {
            return res.json( { message: scriptReturn.stdout.toString( 'utf8' ) } );
        } else {
            return res.json( { error: true, message: scriptReturn.error.code } );
        }
    } else {
        var stdret = scriptReturn.stderr.toString( 'utf8' ) + "" + scriptReturn.stdout.toString( 'utf8' );
        return res.json( { error: true, message: stdret } );
    }
});

router.put( '/:id', function( req, res, next ) {
    var id      = req.params.id;
    var cols    = { 
        'phone_number': false, 'first_name': false, 'last_name': false, 'default_rate': false,
        'lat': false, 'lng': false, 'language': false
    };
    if ( isNaN( id ) ) {
        console.log( "Invalid id for user: ", req.body );
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
        console.log( "No parameters to update in user: ", req.body );
        return res.json( [] );
    }
    /*
    pg.connect( userDB, function( err, client, done ) {
        if ( err ) {
            return console.error( 'error fetching client from pool', err );
        }
        var sql = "UPDATE users SET " + upClause + " \
                   WHERE  id = " + id + " \
                   RETURNING id, phone_number, first_name, last_name, default_rate, send_sms, image_url, \
                             language, lat, lng, address, city, state";
        client.query( sql, params, function( err, result ) {
            done();
            if ( err ) {
                return console.error( 'error posting user', err );
            } else {
                return res.json( result.rows );
            }
        });
    })
    */;
});

module.exports = router;
