var fetch    = require('node-fetch');
var Util     = require('../helpers/util.js');

var queue_util = {
    insertMessage: function( to_userid, client_app, type, data, status, callback ) {
        if ( ! isNaN( to_userid ) && type && data ) {
            var post_data  = {
                to_userid: to_userid,
                client_app: client_app,
                type: type,
                data: data,
                status: status
            };
            var url = Util.getPrivateAPIUrl( '/v1/messages_priv/' );
            fetch( url, { method: 'post',
                          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                          body: JSON.stringify( post_data ) })
                .then( function( resPriv ) { return resPriv.json(); })
                .then( function( json ) { return callback( null, json ); })
                .catch( function( err ) { console.log( "Fetch error: ", err ); });
        }
    },

    updateRequestStatus: function( id, put_data, callback ) {
        if ( isNaN( id )) {
            return callback( "NaN id: " + id );
        }
        var url = Util.getPrivateAPIUrl( '/v1/shift_requests_priv/' + id );
        fetch( url, { method: 'put', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                      body: JSON.stringify( put_data ) })
            .then( function( res ) { return res.json(); })
            .then( function( json ) { callback( null, json ); })
            .catch( function( err ) { console.log( "Fetch error1: ", err ); });
    },

    updateResponseStatus: function( id, put_data, callback ) {
        if ( isNaN( id )) {
            return callback( "NaN id: " + id );
        }
        var url = Util.getPrivateAPIUrl( '/v1/shift_responses_priv/' + id );
        fetch( url, { method: 'put', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                      body: JSON.stringify( put_data ) })
            .then( function( res ) { return res.json(); })
            .then( function( json ) { callback( null, json ); })
            .catch( function( err ) { console.log( "updateResponseStatus fetch error: ", err ); });
    },

    getRequest: function( id, callback ) {
        if ( isNaN( id )) {
            return callback( "getRequest: NaN id: " + id );
        }
        var url = Util.getPrivateAPIUrl( '/v1/shift_requests_priv/' + id );
        fetch( url )
            .then( function( res ) { return res.json(); })
            .then( function( reqJson ) { callback( null, reqJson ); })
            .catch( function( err ) { console.log( "QueueUtil.getRequest error: ", err ); });
    },

    getResponsesByRequestIdAndStatus: function( reqid, status, callback ) {
        if ( isNaN( reqid )) {
            callback( 'NaN id' + reqid );
        }
        var resp_url = Util.getPrivateAPIUrl( '/v1/shift_responses_priv/?request_id=' + reqid + "&status=" + status );
        fetch( resp_url )
            .then( function( res ) { return res.json(); })
            .then( function( json ) { callback( null, json ); })
            .catch( function( err ) { console.log( "getResponsesByRequestIdAndStatus error: ", err ); });
    },

    getResponsesByRequestId: function( reqid, callback ) {
        if ( isNaN( reqid )) {
            callback( 'get ResponsesByRequestId NaN id' + reqid );
        }
        var resp_url = Util.getPrivateAPIUrl( '/v1/shift_responses_priv/?request_id=' + reqid );
        fetch( resp_url )
            .then( function( res ) { return res.json(); })
            .then( function( resJson ) { callback( null, resJson ); })
            .catch( function( err ) { console.log( "getResponsesByRequestId Fetch error: ", err ); });
    },

    updateShiftResponse: function( respid, put_data, callback ) {
        if ( isNaN( respid )) {
            return callback( 'Invalid response id' );
        }
        var url = Util.getPrivateAPIUrl( '/v1/shift_responses_priv/' + respid );
        fetch( url, { method: 'put', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                      body: JSON.stringify( put_data ) })
            .then( function( res ) { return res.json(); })
            .then( function( json ) { callback( 'response id ' + respid + ' successfully updated' ); })
            .catch( function( err ) { console.log( "Fetch error3: ", err ); });
    }
    

};

module.exports = queue_util;
