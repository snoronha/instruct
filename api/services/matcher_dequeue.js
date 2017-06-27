#!/usr/bin/env node

var Queue     = require('bull');
var fetch     = require('node-fetch');
var Q         = require('q');
var Util      = require('../helpers/util.js');
var QueueUtil = require('./queue_util.js');

var requestQueue = Queue( 'REQUEST_READY_PROD', Util.getRedisQPort(), Util.getRedisQHost() );
var messageQueue = Queue( 'MESSAGE_PROD', Util.getRedisQPort(), Util.getRedisQHost() );

// Queue processing loop
// 1 --> only one request gets processed at a time
requestQueue.process( 1, function( msg, done ) {
    processRequestQueue( msg.data );
    done();
});

console.log("Matching engine started up...");

function processRequestQueue( requestArray ) {
    requestArray.forEach( function( req ) {
        if ( ! isNaN( req.id )) {
            getRequestByFilters( req.id, function( reqs ) {
                if ( reqs.length <= 0 || isNaN( reqs[0].store_id )) {
                    console.log( "No requests found for id=" + req.id );
                    return;
                }
                var num_hours = ( Util.getTimeDiff( reqs[0].start_ts, reqs[0].end_ts ) / 3600000.0 );
                getStoreById( reqs[0].store_id, function( store ) {
                    if ( store.length <= 0 || isNaN( store[0].lng ) || isNaN( store[0].lat ) ) {
                        console.log( "No store details found for store_id=" + reqs[0].store_id );
                        return;
                    }
                    getHelpersByFilters( store[0].id, store[0].lng, store[0].lat, reqs[0].role_id, function( users ) {
                        // iterate over users
                        if ( users.length <= 0 ) {
                            // send manager a notification that no helpers were found
                            var shift_str = Util.getTimeString( reqs[0].start_ts, reqs[0].end_ts );
                            var msg = JSON.stringify({
                                msg_type: "NO_HELPERS_FOUND",
                                msg_data: { role: reqs[0].role.name, shift_hours: num_hours, shift_str: shift_str },
                                data: { request_id: reqs[0].id, type: 'NO_HELPERS_FOUND' },
                            });
                            QueueUtil.insertMessage(
                                reqs[0].manager_userid, 'MANAGER', 'NO_HELPERS_FOUND', msg, 'READY',
                                function( err, msgJson ) {
                                    if ( msgJson.length > 0 ) {
                                        messageQueue.add({ 
                                            id: msgJson[0].id, to_userid: reqs[0].manager_userid, 
                                            client_app: 'MANAGER', type: 'NO_HELPERS_FOUND', data: msg 
                                        });
                                    }
                                });
                        }
                        users.forEach( function( user ) {
                            var request_id = reqs[0].id, store_id = store[0].id;
                            var m_userid   = reqs[0].manager_userid, h_userid = user.id;
                            var role_id    = reqs[0].role_id;
                            var rate       = Util.getFloatFromAmount( user.default_rate );
                            var amount     = (rate * num_hours).toFixed(2);
                            var start_ts   = reqs[0].start_ts, end_ts = reqs[0].end_ts;
                            var shift_str  = Util.getTimeString( start_ts, end_ts );
                            insertShiftResponse(
                                request_id, store_id, m_userid, h_userid, amount, role_id, start_ts, end_ts,
                                function( resp ) {
                                    // ping helpers
                                    var msg = JSON.stringify({
                                        msg_type: 'INVITE_BID',
                                        msg_data: { amount: amount, shift_hours: num_hours, store: store[0],
                                                    shift_str: shift_str },
                                        data: { response_id: resp[0].id, type: 'INVITE_BID' },
                                    });
                                    QueueUtil.insertMessage(
                                        h_userid, 'HELPER', 'INVITE_BID', msg, 'READY',
                                        function( err, msgJson ) {
                                            if ( msgJson.length > 0 ) {
                                                messageQueue.add({ 
                                                    id: msgJson[0].id, to_userid: h_userid, 
                                                    client_app: 'HELPER', type: 'INVITE_BID', data: msg 
                                                });
                                            }
                                        });
                                });
                        });
                        // update request status
                        QueueUtil.updateRequestStatus( reqs[0].id, { "status": "BIDDING_OPEN" }, function( err, msg ) {
                            console.log( msg );
                        });
                    });
                });

            });
        }
    });
}

function getRequestByFilters( id, callback ) {
    if ( isNaN( id )) {
        return callback( [] );
    }
    var url = Util.getPrivateAPIUrl( '/v1/shift_requests_priv/?id=' + id + "&status=READY" );
    fetch( url )
        .then( function( res ) { return res.json(); })
        .then( function( json ) { callback( json ); })
        .catch( function( err ) { console.log( "Fetch error: ", err ); });
}

function getStoreById( id, callback ) {
    if ( isNaN( id )) {
        callback( [] );
    }
    var url = Util.getPrivateAPIUrl( '/v1/stores_priv/' + id );
    fetch( url )
        .then( function( resPriv ) { return resPriv.json(); })
        .then( function( json ) { callback( json ); })
        .catch( function( err ) { console.log( "Fetch error: ", err ); });
}

function getHelpersByFilters( store_id, lng, lat, role_id, callback ) {
    if ( isNaN( lng ) || isNaN( lat ) || ! role_id ) {
        console.log( "Bad Helper Match Data: role_id=" + role_id + " lat=" + lat + " lng=" + lng );
        callback( [] );
        return;
    }
    // Check if store is type 1/2/3
    var url = Util.getPrivateAPIUrl( '/v1/stores_priv/?id=' + store_id );
    fetch( url )
        .then( function( storeRes ) { return storeRes.json(); })
        .then( function( storeJson ) {
            if ( storeJson.length <= 0 ) {
                console.log( "No store found for store_id: " + store_id );
                return;
            }
            var store = storeJson[0];

            if ( ! store.type || store.type === 1 ) { // Type 1 - this store only

                getHelpers( store_id, role_id, callback );

            } else if ( store.type === 2 ) { // Type 2 - same owner only

                // Get owners
                url = Util.getPrivateAPIUrl( '/v1/store_users_priv/?s.store_id=' + store_id + '&r.type=OWNER' );
                fetch( url )
                    .then( function( ownerRes ) { return ownerRes.json(); })
                    .then( function( ownerJson ) {
                        var userids = ownerJson.map( function( obj ) { return obj.userid; }).join( "," );
                        if ( userids ) {
                            // Get helpers from all stores owned by this owner
                            url = Util.getPrivateAPIUrl( '/v1/store_users_priv/?s.userid=' + userids +'&r.type=OWNER');
                            fetch( url )
                                .then( function( storesRes ) { return storesRes.json(); })
                                .then( function( storesJson ) {
                                    var storeids = storesJson.map( function( obj ) { return obj.store_id; }).join(",");
                                    if ( storeids ) {
                                        getHelpers( storeids, role_id, callback );
                                    } else {
                                        // Get helpers from the store with store_id
                                        getHelpers( store_id, role_id, callback );
                                    }
                                })
                                .catch( function( err ) { console.log( "Fetch error: ", err ); });
                        } else {
                            // Get helpers from the store with store_id
                            getHelpers( store_id, role_id, callback );
                        }
                    })
                    .catch( function( err ) { console.log( "Fetch error: ", err ); });

            } else if ( store.type === 3 ) { // Type 3 - open market

                // Get users with role_id within radius of lat/lng
                getGeoHelpers( lng, lat, role_id, callback )

            }
        })
        .catch( function( err ) { console.log( "Fetch error: ", err ); });
}

function getHelpers( store_ids, role_id, callback ) {
    var url = Util.getPrivateAPIUrl( '/v1/store_users_priv/?s.store_id=' + store_ids + '&s.role_id=' + role_id);
    fetch( url )
        .then( function( storeUserRes ) { return storeUserRes.json(); })
        .then( function( storeUserJson ) {
            if ( storeUserJson.length <= 0 ) {
                callback( [] );
                return;
            }
            var userids = storeUserJson.map( function( obj ) { return obj.userid; }).join( ',' );
            url = Util.getPrivateAPIUrl( '/v1/users_priv/?id=' + userids );
            fetch( url )
                .then( function( res ) { return res.json(); })
                .then( function( json ) { callback( json ); })
                .catch( function( err ) { console.log( "Fetch error: ", err ); });
        })
        .catch( function( err ) { console.log( "Fetch error: ", err ); });
}

function getGeoHelpers( lng, lat, role_id, callback ) {
    var url = Util.getPrivateAPIUrl( '/v1/users_priv/' + lng + '/' + lat + '/?s.role_id=' + role_id );
    fetch( url )
        .then( function( usersRes ) { return usersRes.json(); })
        .then( function( usersJson ) {
            if ( usersJson.length <= 0 ) {
                callback( [] );
                return;
            }
            callback( usersJson );
        })
        .catch( function( err ) { console.log( "Fetch error: ", err ); });
}

function insertShiftResponse( request_id, store_id, m_userid, h_userid, amount, role_id, start_ts, end_ts, callback ) {
    if ( ! isNaN( request_id ) && ! isNaN( store_id ) && ! isNaN( m_userid ) && ! isNaN( h_userid ) && 
         start_ts && end_ts && amount ) {
        var post_data  = {
            request_id: request_id,
            store_id: store_id,
            manager_userid: m_userid,
            helper_userid: h_userid,
            amount: amount,
            role_id: role_id,
            start_ts: start_ts,
            end_ts: end_ts,
            status: 'READY',
        };
        var url = Util.getPrivateAPIUrl( '/v1/shift_responses_priv/' );
        fetch( url, { method: 'post', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                      body: JSON.stringify( post_data ) })
            .then( function( res ) { return res.json(); })
            .then( function( json ) { callback( json ); })
            .catch( function( err ) { console.log( "Fetch error: ", err ); });
    }
}

