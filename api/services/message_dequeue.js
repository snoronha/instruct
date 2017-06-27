#!/usr/bin/env node

var _        = require('underscore');
var Queue    = require('bull');
var fetch    = require('node-fetch');
var Q        = require('q');
var Util     = require('../helpers/util.js');
var I18nUtil = require('../helpers/i18n_util.js');

var messageQueue = Queue( 'MESSAGE_PROD', Util.getRedisQPort(), Util.getRedisQHost() );

messageQueue.on( "error", function( err ) {
    var dt = new Date();
    console.log( dt + ": message_dequeue: messageQueue error: ", err );
});

messageQueue.on( "end", function() {
    var dt = new Date();
    console.log( dt + ": message_dequeue: ended" );
});

messageQueue.on( "ready", function() {
    // Queue processing loop
    // 1 --> only one request gets processed at a time
    var dt = new Date();
    console.log( dt + ": messaging engine started up ..." );
    messageQueue.process( 1, function( msg, done ) {
        processMessageQueue( msg.data );
        done();
    });
});

function processMessageQueue( msg ) {
    if ( ! isNaN( msg.id ) && ! isNaN( msg.to_userid ) && msg.client_app ) {
        var now      = new Date();
        var msgblob  = JSON.parse( msg.data ); // used for IOS/IOS_DEV/IOS_ENTERPRISE/IOS_ENTERPRISE_DEV
        console.log( "[" + now + "]: client_app=" + msg.client_app + " to=" + msg.to_userid + " data: ", msg.data );

        getUser( msg.to_userid, function( userJson ) {
            var lang = userJson[0].language ? userJson[0].language : 'en';
            if ( ! msgblob.msg_body && msgblob.msg_type && msgblob.msg_data ) {
                // new templated notifications
                // var msg_body = I18nUtil.getTemplate( msgblob.msg_type, msgblob.msg_data, lang );
                var msgBodyTitle  = I18nUtil.getTemplate( msgblob.msg_type, msgblob.msg_data, lang );
                msgblob.msg_title = msgBodyTitle.title;
                msgblob.msg_body  = msgBodyTitle.body;
                msg.data          = JSON.stringify( msgblob );
            }
            var aps_data = { aps: { alert: msgblob.msg_body }, data: msgblob.data };
            
            getDevicesForUser( msg.to_userid, function( devices ) {
                devices.forEach( function( device ) {
                    // Format for iOS/iOS_DEV push
                    var send_data = null;
                    if ( device.platform.toUpperCase() === 'IOS_DEV' ||
                         device.platform.toUpperCase() === 'IOS_ENTERPRISE_DEV' ) {
                        send_data = { APNS_SANDBOX: JSON.stringify( aps_data ) };
                    } else if ( device.platform.toUpperCase() === 'IOS' ||
                                device.platform.toUpperCase() === 'IOS_ENTERPRISE' ) {
                        send_data = { APNS: JSON.stringify( aps_data ) };
                    } else {
                        send_data = msg.data;
                    }
                    
                    // Check for HELPER/MANAGER client_app (called role in device record)
                    if ( device.role.toUpperCase() == msg.client_app ) {
                        var sns = Util.getSNS( device.platform.toUpperCase(), device.role.toUpperCase() );
                        if ( device.endpoint_arn ) {
                            now = new Date();
                            console.log( '[' + now + ']: sending SNS: to=' + msg.to_userid + ' platform=' + device.platform.toUpperCase() + ' role=' + device.role.toUpperCase() + ' data: ', msgblob.data );
                            Util.sendSNS( sns, send_data, device.endpoint_arn, null, function( err ) {
                                handleSNSFail( err, device.id );
                            });
                        }
                    }
                }); // devices.forEach
            
                // Handle SMS
                var client_app  = msg.client_app; var url;
                var request_id  = msgblob.data.request_id ? msgblob.data.request_id : null;
                var response_id = msgblob.data.response_id ? msgblob.data.response_id : null;
                if ( devices.length > 0 ) {
                    var pform = devices[0].platform.toUpperCase();
                    switch ( pform ) {
                    case 'IOS_DEV':
                        if ( client_app === 'HELPER' ) { url = "nfth://rs/" + response_id; }
                        else if ( client_app === 'MANAGER' ) { url = "nftm://rq/" + request_id; }
                        break;
                    case 'IOS_ENTERPRISE_DEV':
                        if ( client_app === 'HELPER' ) { url = "nfth://rs/" + response_id; }
                        else if ( client_app === 'MANAGER' ) { url = "nftm://rq/" + request_id; }
                        break;
                    case 'IOS':
                        if ( client_app === 'HELPER' ) { url = "nfth://rs/" + response_id; }
                        else if ( client_app === 'MANAGER' ) { url = "nftm://rq/" + request_id; }
                        break;
                    case 'IOS_ENTERPRISE':
                        if ( client_app === 'HELPER' ) { url = "nfth://rs/" + response_id; }
                        else if ( client_app === 'MANAGER' ) { url = "nftm://rq/" + request_id; }
                        break;
                    case 'ANDROID_DEV':
                        if ( client_app === 'HELPER' ) { url = "http://nfth.work/rs/" + response_id; }
                        else if ( client_app === 'MANAGER' ) { url = "http://nftm.work/rq/" + request_id; }
                        break;
                    case 'ANDROID':
                        if ( client_app === 'HELPER' ) { url = "http://nfth.work/rs/" + response_id; }
                        else if ( client_app === 'MANAGER' ) { url = "http://nftm.work/rq/" + request_id; }
                        break;
                    }
                }
                if ( userJson.length > 0 && userJson[0].phone_number && userJson[0].send_sms ) {
                    now = new Date();
                    var intl_phone_number = userJson[0].phone_number.toString();
                    var sms_msg_body      = url ? url + " " + msgblob.msg_body : msgblob.msg_body;
                    if ( sms_msg_body.length >= 155 ) {
                        console.log( '[' + now + ']: trunc-ing long SMS message: to_userid=' + msg.to_userid + " phone=" + intl_phone_number + " text: " + sms_msg_body );
                        sms_msg_body = sms_msg_body.substring( 0, 155 ) + " ..."
                    }
                    console.log( '[' + now + ']: sending_SMS: to_userid=' + msg.to_userid + " phone=" + intl_phone_number + " text: " + sms_msg_body );
                    Util.sendSMS( intl_phone_number, sms_msg_body );
                }
            });
        });
        
        updateMessageStatus( msg.id, { status: 'SENT' }, function( msgJson ) {
            // console.log( "MSG SUCCESS: ", msgJson );
        });
    }
}

function getDevicesForUser( userid, success ) {
    if ( ! isNaN( userid )) {
        var url = Util.getPrivateAPIUrl( '/v1/devices_priv/?userid=' + userid +
                                         '&is_disabled=false&sortDsc=created_at' );
        fetch( url )
            .then( function( devPriv ) { return devPriv.json(); })
            .then( function( devJson ) { success( devJson );})
            .catch( function( err ) { console.log( "Fetch error: ", err ); });
    }
}

function updateMessageStatus( id, put_data, success ) {
    if ( ! isNaN( id )) {
        var url = Util.getPrivateAPIUrl( '/v1/messages_priv/' + id );
        fetch( url, { method: 'put', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                      body: JSON.stringify( put_data ) })
            .then( function( msgPriv ) { return msgPriv.json(); })
            .then( function( msgJson ) { success( msgJson ); })
            .catch( function( err ) { console.log( "Fetch error: ", err ); });
    }
}

function getUser( userid, success ) {
    if ( ! isNaN( userid )) {
        var url = Util.getPrivateAPIUrl( '/v1/users_priv/?id=' + userid );
        fetch( url )
            .then( function( userPriv ) { return userPriv.json(); })
            .then( function( userJson ) { success( userJson );})
            .catch( function( err ) { console.log( "Fetch error: ", err ); });
    }
}

function handleSNSFail( err, device_id ) {
    console.log( "SNS Fail: " + err.code + " device_id=" + device_id );
    if ( ! err.code || err.code != 'EndpointDisabled' || isNaN( device_id )) {
        return;
    }
    var url = Util.getPrivateAPIUrl( '/v1/devices_priv/' + device_id );
    fetch( url, { method: 'put', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                  body: JSON.stringify({ is_disabled: 'true' }) })
        .then( function( devPriv ) { return devPriv.json(); })
        .then( function( devJson ) { })
        .catch( function( err ) { console.log( "Handle SNS Fail error: ", err ); });
}
