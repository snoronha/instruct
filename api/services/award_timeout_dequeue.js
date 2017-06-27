#!/usr/bin/env node

var Queue      = require('bull');
var fetch      = require('node-fetch');
var Q          = require('q');

var Util       = require('../helpers/util.js');
var QueueUtil  = require('./queue_util.js');

var awardTimeoutQueue = Queue( 'AWARD_TIMEOUT', Util.getRedisQPort(), Util.getRedisQHost() );
var messageQueue      = Queue( 'MESSAGE_PROD', Util.getRedisQPort(), Util.getRedisQHost() );

messageQueue.on( "error", function( err ) {
    var dt = new Date();
    console.log( dt + ": award_timeout_dequeue: messageQueue error: ", err );
});

awardTimeoutQueue.on( "error", function( err ) {
    var dt = new Date();
    console.log( dt + ": award_timeout_dequeue: awardTimeoutQueue error: ", err );
});

awardTimeoutQueue.on( "ready", function() {
    // Queue processing loop
    // 1 --> only one request gets processed at a time
    var dt = new Date();
    console.log( dt + ": Award Timeout engine started up..." );
    awardTimeoutQueue.process( 1, function( msg, done ) {
        processAwardTimeoutQueue( msg.data );
        done();
    });
});

function processAwardTimeoutQueue( requestArray ) {
    requestArray.forEach( function( req ) {
        if ( isNaN( req.id )) {
            console.log( "ERROR: Found bad request id in Award Timeout Queue: ", req);
            return;
        }
        QueueUtil.getRequest( req.id, function( err, requestGet ) {
            if ( err ) {
                console.log( "ERROR: " + err );
                return;
            }
            if ( requestGet.length <= 0 ) {
                console.log( "No request found for time out: ", req.id);
                return;
            }

            var request = requestGet[0];
            if ( request.status == 'READY' || request.status == 'BIDDING_OPEN' || 
                 request.status == 'BIDS_RECEIVED' || request.status == 'NO_HELPERS_ACCEPTED_BID_IN_TIME' ) {
                // Process request for award timeout

                QueueUtil.updateRequestStatus( request.id, { 'status' : 'AWARD_TIMEOUT' }, function( err, reqUpdArr ) {
                    if ( err ) {
                        console.log( "ERROR: " + err );
                        return;
                    }
                    if ( reqUpdArr.length <= 0 ) {
                        console.log( "No request found for time out: ", request.id);
                        return;
                    }
                    var reqUpd    = reqUpdArr[0];
                    var time_diff = Util.getTimeDiff( reqUpd.start_ts, reqUpd.end_ts );
                    var time_hrs  = Math.round( time_diff / ( 3600 * 1000 ));
                    var shift_str = Util.getTimeString( reqUpd.start_ts, reqUpd.end_ts );

                    console.log("Manager timed out on awarding helpers for request", request.id);
                    // Successfully updated shift request status to AWARD_TIMEOUT
                    QueueUtil.getResponsesByRequestIdAndStatus(
                        request.id, 'HELPER_ACCEPTED_BID',
                        function( err, resps ) {
                            if ( err ) {
                                return console.err( "ERROR: " + err );
                            }
                            if ( resps.length <= 0 ) {
                                console.log( "No ACCEPTED responses found for reqid: ", request.id );
                                return;
                            }

                            var numbids = resps.length, minAmount = 10000000;
                            var bidstr  = ( numbids > 1 ) ? numbids + " bids" : numbids + " bid";
                            var another = ( numbids > 1 ) ? "another" : "a";
                            resps.forEach( function( resReq ) {
                                var amt   = Number(resReq.amount.replace(/[^0-9\.]+/g,""));
                                if ( amt < minAmount ) {
                                    minAmount = amt;
                                }
                            });
                            if ( numbids > 0 ) {
                                var mgrMsg = JSON.stringify({
                                    msg_title: "You missed filling your shift",
                                    msg_body: "You missed the deadline to pick a " + reqUpd.role.name + " for " + shift_str + ". You had " + numbids + " bidders, least bid being $" + minAmount + ". If still interested, call us at 1-510-458-1346 and we’ll see if we can still get you a helper",
                                    data: { request_id: request.id, type: 'AWARD_TIMEOUT' }
                                });
                                // Send manager message 
                                QueueUtil.insertMessage(
                                    request.manager_userid, 'MANAGER', 'AWARD_TIMEOUT', mgrMsg, 'READY',
                                    function( err, msgJson ) {
                                        if (msgJson.length > 0 ) {
                                            messageQueue.add({
                                                id: msgJson[0].id,
                                                to_userid: request.manager_userid,
                                                client_app: 'MANAGER',
                                                type: 'AWARD_TIMEOUT',
                                                data: mgrMsg
                                            });
                                        }
                                    });
                                // For each HELPER_ACCEPTED_BID bid, send out a message to the helper
                                resps.forEach( function( resReq ) {
                                    var msg = JSON.stringify({
                                        msg_title: "Sorry the shift was canceled",
                                        msg_body: "So sorry, but the " + resReq.amount + " for " + time_hrs + " hours shift request was cancelled. The manager didn't pick anyone for the shift. We are working on getting you the next opportunity!",
                                        data: { response_id: resReq.id, request_id: request.id, type: 'AWARD_TIMEOUT' }
                                    });
                                    // Send helper message 
                                    QueueUtil.insertMessage(
                                        resReq.helper_userid, 'HELPER', 'AWARD_TIMEOUT', msg, 'READY',
                                        function( err, msgJson ) {
                                            if (msgJson.length > 0 ) {
                                                messageQueue.add({
                                                    id: msgJson[0].id,
                                                    to_userid: resReq.helper_userid,
                                                    client_app: 'HELPER',
                                                    type: 'AWARD_TIMEOUT',
                                                    data: msg
                                                });
                                            }
                                        });
                                });
                            } // end if numbids > 0

                        });
                });
                
                
            } else {
                console.log( "Award timeout processed. No action. ID = " + request.id + " status = " + request.status);
                return;
            }
        });
        
    });
};

