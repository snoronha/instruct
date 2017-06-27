var express = require('express');
var router  = express.Router();
var fetch   = require('node-fetch');

var Util    = require('../helpers/util.js');

// GET store_users by filter criteria
router.get( '/', function( req, res, next ) {
    var privEndpoint = req.originalUrl.replace( "store_users", "store_users_priv" );
    var url = Util.getPrivateAPIUrl( privEndpoint );
    fetch( url )
        .then( function( resPriv ) { return resPriv.json(); })
        .then( function( json ) { return res.send( json ); })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json({ error: err }); });
});

router.get( '/owner/:store_id', function( req, res, next ) {
    var store_id = req.params.store_id;
    if ( isNaN( store_id )) {
        console.log( "Invalid store_id: " + store_id );
        return res.send({ error: "Invalid store_id" });
    }
    var url = Util.getPrivateAPIUrl( '/v1/store_users_priv/?s.store_id=' + store_id + '&r.name=OWNER' );
    fetch( url )
        .then( function( resPriv ) { return resPriv.json(); })
        .then( function( resJson ) { return res.send( resJson ); })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json({ error: err }); });
});

// get users for the same store
router.get( '/same_store/:store_id', function( req, res, next ) {
    var store_id = req.params.store_id;
    if ( isNaN( store_id )) {
        console.log( "Invalid store_id: " + store_id );
        return res.send({ error: "Invalid store_id" });
    }
    var url = Util.getPrivateAPIUrl( '/v1/store_users_priv/?s.store_id=' + store_id );
    fetch( url )
        .then( function( resPriv ) { return resPriv.json(); })
        .then( function( resJson ) { return res.send( resJson ); })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json({ error: err }); });
});

// get users for the same owner of this store
/*
router.get( '/same_owner/:store_id', function( req, res, next ) {
    var store_id = req.params.store_id;
    if ( isNaN( store_id )) {
        console.log( "Invalid store_id: " + store_id );
        return res.send({ error: "Invalid store_id" });
    }
    var url = Util.getPrivateAPIUrl( '/v1/store_users/owner/' + store_id );
    fetch( url )
        .then( function( ownPriv ) { return ownPriv.json(); })
        .then( function( ownJson ) {
            console.log( "OWNJSON: ", ownJson );
            if ( ownJson.length <= 0 ) {
                return res.send({ error: "No stores found with this store: " + store_id });
            }
            var owners  = '';
            ownJson.forEach( function( elem ) {
                owners += ( owners.length > 0 ) ? "," + elem.userid : elem.userid;
            });
            // Find all stores owned by these owners
            url = Util.getPrivateAPIUrl( '/v1/store_users_priv/?s.userid=' + owners + '&r.name=OWNER' );
            fetch( url )
                .then( function( storePriv ) { return storePriv.json(); })
                .then( function( storeJson ) {
                    if ( storeJson.length <= 0 ) {
                        return res.send({ error: "No stores found with these owners: " + owners });
                    }
                    var store_ids = "", storeHash = {};
                    storeJson.forEach( function( elem ) {
                        var elem_store_id = elem.store_id;
                        if ( ! ( elem_store_id in storeHash )) {
                            store_ids += ( store_ids.length > 0 ) ? "," + elem_store_id : elem_store_id;
                        }
                        storeHash[elem.store_id] = true;
                    });
                    // Find all users associated with the stores found above
                    url = Util.getPrivateAPIUrl( '/v1/store_users_priv/?s.store_id=' + store_ids );
                    fetch( url )
                        .then( function( usersPriv ) { return usersPriv.json(); })
                        .then( function( usersJson ) {
                            return res.send( usersJson );
                        })
                        .catch( function( err ) { return res.json({ error: err }); });
                })
                .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json({ error: err }); });
        })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json({ error: err }); });
});
*/

router.post( '/', function( req, res, next ) {
    var store_id = req.body.store_id;
    var userid   = req.body.userid;
    var role_id  = req.body.role_id || "";
    var post_data  = {
        store_id: store_id,
        userid: userid,
        role_id: role_id,
    };
    if ( isNaN( store_id ) || isNaN( userid ) || isNaN( role_id ) ) {
        console.log( "Invalid input store_user: ", req.body );
        return res.json( { error: 'Invalid request', message: req.body } );
    }
    // Check whether this user is a manager in any store
    var url = Util.getPrivateAPIUrl( '/v1/store_users_priv/?s.userid=' + userid + '&r.type=MANAGER' );
    fetch( url )
        .then( function( storeUserPriv ) { return storeUserPriv.json(); })
        .then( function( storeUserJson ) {
            if ( storeUserJson.length > 0 ) {
                return res.send({ error: 'User is already a manager' });
            }
            url = Util.getPrivateAPIUrl( '/v1/store_users_priv/' );
            fetch( url, { method: 'post',
                          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                          body: JSON.stringify( post_data ) })
                .then( function( resPriv ) { return resPriv.json(); })
                .then( function( resJson ) { return res.send( resJson ); })
                .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json({ error: err }); });
        })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json({ error: err }); });
});

router.put( '/', function( req, res, next ) {
    var cols     = { 'store_id': false, 'userid': false, 'role_id': false }; 
    var put_data = {};
    for( var key in req.body ) {
        if ( key in cols ) {
            put_data[key] = req.body[key];
        }
    }
    if ( Object.keys( put_data ).length <= 0 ) {
        console.log( "No parameters to update in store_users: ", req.body );
        return res.json({ error: "No parameters to update in store_users" });
    }
    var privEndpoint = req.originalUrl.replace( "store_users", "store_users_priv" );
    var url = Util.getPrivateAPIUrl( privEndpoint );
    fetch( url, { method: 'put', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                  body: JSON.stringify( put_data ) })
        .then( function( resPriv ) { return resPriv.json(); })
        .then( function( json ) { return res.send( json ); })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json({ error: err }); });
});

module.exports = router;
