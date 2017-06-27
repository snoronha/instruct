#!/usr/bin/env node

var Queue      = require('bull');
var fetch      = require('node-fetch');

var Util       = require('../helpers/util.js');
var QueueUtil  = require('./queue_util.js');

var bidTimeoutQueue = Queue( 'BID_TIMEOUT', Util.getRedisQPort(), Util.getRedisQHost() );
var messageQueue    = Queue( 'MESSAGE_PROD', Util.getRedisQPort(), Util.getRedisQHost() );

messageQueue.on( "error", function( err ) {
    var dt = new Date();
    console.log( dt + ": bid_timeout_dequeue: messageQueue error: ", err );
});

bidTimeoutQueue.on( "error", function( err ) {
    var dt = new Date();
    console.log( dt + ": bid_timeout_dequeue: bidTimeoutQueue error: ", err );
});

bidTimeoutQueue.on( "ready", function() {
    // Queue processing loop
    // 1 --> only one request gets processed at a time
    var dt = new Date();
    console.log( dt + ": Bid Timeout engine started up..." );
    bidTimeoutQueue.process( 1, function( msg, done ) {
        processBidTimeoutQueue( msg.data );
        done();
    });
});


function processBidTimeoutQueue( requestArray ) {
    requestArray.forEach( function( req ) {
        if ( isNaN( req.id )) {
            console.log( "ERROR: Found bad request id in Bid Timeout Queue: ", req);
            return;
        }
        QueueUtil.getRequest( req.id, function( err, reqs ) {
            if ( err ) {
                console.log( "ERROR: " + err );
                return;
            }
            if ( reqs.length <= 0 ) {
                return;
            }
            var request   = reqs[0];
            var time_diff = Util.getTimeDiff( request.start_ts, request.end_ts );
            var time_hrs  = Math.round( time_diff / ( 3600 * 1000 ));
            var shift_str = Util.getTimeString( request.start_ts, request.end_ts );

            // update request status iff not AWARDED && request/shift not canceled
            if ( request.status != 'AWARDED' && request.status != 'MANAGER_CANCELED_REQUEST' &&
                 request.status != 'MANAGER_CANCELED_SHIFT' && request.status != 'HELPER_CANCELED_SHIFT') {
                QueueUtil.updateRequestStatus(
                    request.id, { 'status' : 'NO_HELPERS_ACCEPTED_BID_IN_TIME' },
                    function( err, updReq ) {
                        if ( err ) {
                            console.log( "updateRequestStatus error: ", err );
                            return;
                        }
                    });
            }

            // Get all responses for this request
            QueueUtil.getResponsesByRequestId( request.id, function( err, resps ) {
                if ( err ) {
                    console.log( "getResponsesByRequestId error: ", err );
                } else {
                    var total = 0, ready = 0, accepted = 0, declined = 0;
                    resps.forEach( function( resp ) {
                        total++;
                        switch( resp.status ) {
                        case 'READY':    ready++; break;
                        case 'HELPER_ACCEPTED_BID': accepted++; break;
                        case 'HELPER_DECLINED_BID': declined++; break;
                        }
                    });

                    if ( total <= 0 ) {
                        return;
                    }
                    if ( ready == total ) {
                        // Send no bids message to manager
                        var msg = JSON.stringify({
                            msg_title: "No one bid",
                            msg_body: "No bids for your " + request.role.name + " for " + time_hrs + " hours shift request for " + shift_str + ". We checked with all the available helpers in the area. Tip: Try offering an additional hour or two",
                            data: { request_id: request.id, type: 'BID_TIMEOUT' }
                        });
                        QueueUtil.insertMessage(
                            request.manager_userid, 'MANAGER', 'BID_TIMEOUT', msg, 'READY',
                            function( err, msgJson ) {
                                if ( msgJson.length > 0 ) {
                                    messageQueue.add({
                                        id: msgJson[0].id,
                                        to_userid: request.manager_userid,
                                        client_app: 'MANAGER',
                                        type: 'BID_TIMEOUT',
                                        data: msg
                                    });
                                }
                            });
                    }
                    
                    // Notify all the helpers in READY state that they missed out
                    resps.forEach( function( resp ) {
                        var time_diff = Util.getTimeDiff( request.start_ts, request.end_ts );
                        var time_hrs  = Math.round( time_diff / ( 3600 * 1000 ));
                        var shift_str = Util.getTimeString( request.start_ts, request.end_ts );
                        if ( resp.status == 'READY' ) {
                            // update response to BID_TIMEOUT
                            QueueUtil.updateResponseStatus(
                                resp.id, { 'status' : 'BID_TIMEOUT' }, function( err, updRes ) {
                                    if ( err ) {
                                        console.log( "updateResponseStatus error: ", err );
                                    }
                                });
                            
                            // Send no bids message to manager
                            var msg = JSON.stringify({
                                msg_title: "You missed out",
                                msg_body: "You missed your chance to make " + resp.amount + " for " + time_hrs + " hours, " + shift_str + ". Do make sure to respond within 30 minutes next time. Don't miss out!",
                                data: { request_id: request.id, response_id: resp.id,
                                        type: 'NO_HELPERS_ACCEPTED_BID_IN_TIME' }
                            });
                            QueueUtil.insertMessage(
                                resp.helper_userid, 'HELPER', 'NO_HELPERS_ACCEPTED_BID_IN_TIME', msg, 'READY',
                                function( err, msgJson ) {
                                    if ( msgJson.length > 0 ) {
                                        messageQueue.add({
                                            id: msgJson[0].id,
                                            to_userid: resp.helper_userid,
                                            client_app: 'HELPER',
                                            type: 'NO_HELPERS_ACCEPTED_BID_IN_TIME',
                                            data: msg
                                        });
                                    }
                                });
                        }
                    }); // end of resps.forEach
                        
                }
            });
        });
    });
};
