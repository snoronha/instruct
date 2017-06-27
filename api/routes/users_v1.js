var express  = require('express');
var router   = express.Router();
var fetch    = require('node-fetch');
var request  = require('request');

var Util     = require('../helpers/util.js');

/**
 * @api {get} /user/?<filters> Get a User by filter criteria
 * @apiVersion 1.0.0
 * @apiName GetUser
 * @apiGroup User
 * @apiPermission admin
 *
 * @apiDescription Get Users by id, first_name, last_name
 *
 * @apiExample Example usage:
 * curl -XGET http://nextforce.us/v1/users/?id=6790,6791
 * curl -XGET http://nextforce.us/v1/users/?first_name=Tony
 *
 * @apiSuccess {Object[]} users         List of Users (Array of Objects)
 * @apiSuccess {Number}   users.id           userid
 * @apiSuccess {Number}   users.phone_number phone number
 * @apiSuccess {String}   users.first_name   first_name
 * @apiSuccess {String}   users.last_name    last_name
 * @apiSuccess {Number}   users.lat          latitude
 * @apiSuccess {Number}   users.lng          longitude
 * @apiSuccess {String}   users.default_rate default rate
 * @apiSuccess {String}   users.image_url    image URL
 *
 */

// GET users by filter criteria
router.get( '/', function( req, res, next ) {
    var privEndpoint = req.originalUrl.replace( "users", "users_priv" );
    var url = Util.getPrivateAPIUrl( privEndpoint );
    /*
    fetch( url )
        .then( function( userPriv ) { return userPriv.json(); })
        .then( function( userJson ) { return res.send( userJson ); })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json({ error: err }); });
    */
    return res.send( { hello: 'world' } );
});

//--------------- SAGE Temporary Home --------------//
// GET problem by problem_number
router.get( '/get_settings', function( req, res, next ) {
    var settings = JSON.parse( Util.readFile( "sage_settings.json" ));
    return res.send( settings );
});

router.post( '/update_settings', function( req, res, next ) {
    var text = req.body;
    if ( ! text ) {
        console.log( "Invalid script: ", req.body );
        return res.json( { error: 'Invalid script exec request', message: req.body } );
    }
    var resp = Util.writeFile( JSON.stringify(text), "sage_settings.json" );
    return res.send( resp );
});

router.post( '/CheckTriggers', function( req, res, next ) {
    var params      = req.body.parameters;
    var user        = params.userid;
    var resp        = {status: "Success", results: {}};
    var settings    = JSON.parse( Util.readFile( "sage_settings.json" ));
    var minPriority = 1000;
    var minSetting  = {};
    settings.forEach(function(stg) {
        if (stg.priority < minPriority) {
            minSetting  = stg;
            minPriority = stg.priority;
        }
    });
    if ('priority' in minSetting) {
        resp = {status: "Success", results: {insighttrigger: minSetting.code}}
    }
    return res.send( resp );
});


//-------------End SAGE Temporary Home -------------//

// GET problem by problem_number
router.get( '/problem/:problem_number', function( req, res, next ) {
    var problem_number = req.params.problem_number;
    var problem = JSON.parse( Util.readFile( "problem_" + problem_number + ".json" ));
    for ( var key in problem ) {
        problem[key] = problem[key].join( "\n" );
    }
    return res.send( problem );
});

// GET math problems by problem_number
router.get( '/math_problems/:domain', function( req, res, next ) {
    var domain  = req.params.domain;
    var problem = JSON.parse( Util.readFile( "math_problems_" + domain + ".json" ));
    return res.send( problem );
});

// GET checklist by list_name
router.get( '/checklist/:list_name', function( req, res, next ) {
    var list_name = req.params.list_name;
    var list      = JSON.parse( Util.readFile( "checklist_" + list_name + ".json" ));
    for ( var key in list ) {
        // list[key] = list[key].join( "\n" );
    }
    return res.send( list );
});

// GET checklist by list_name
router.get( '/messenger/:message?', function( req, res, next ) {
    // Use following code to setup Facebook Messenger Webhook integration
    var message = req.params.message;
    console.log( req.query );
    if ( req.query['hub.challenge'] ) {
	return res.send( req.query['hub.challenge'] );
    } else {
	return res.json( req.params.message );
    }
});

// POST endpoint for Messenger Webhook
router.post( '/messenger/:message?', function( req, res, next ) {
    var data = req.body;

    // Make sure this is a page subscription
    if ( data.object == 'page' ) {
	// Iterate over each entry
	// There may be multiple if batched
	data.entry.forEach( function( pageEntry ) {
	    var pageID = pageEntry.id;
	    var timeOfEvent = pageEntry.time;

	    // Iterate over each messaging event
	    pageEntry.messaging.forEach( function( messagingEvent ) {
		if (messagingEvent.optin) {
		    // receivedAuthentication(messagingEvent);
		    console.log( "Received authentication: ", messagingEvent );
		} else if (messagingEvent.message) {
		    console.log( "Received message: ", messagingEvent );
		    receivedMessage(messagingEvent);
		} else if (messagingEvent.delivery) {
		    // receivedDeliveryConfirmation(messagingEvent);
		    console.log( "Received delivery confirmation: ", messagingEvent );
		} else if (messagingEvent.postback) {
		    // receivedPostback(messagingEvent);
		    console.log( "Received postback: ", messagingEvent );
		} else {
		    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
		}
	    });
	});

	// Assume all went well.
	//
	// You must send back a 200, within 20 seconds, to let us know you've 
	// successfully received the callback. Otherwise, the request will time out.
	res.sendStatus(200);
    }

    function receivedMessage(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	console.log("Received message for user %d and page %d at %d with message:", 
		    senderID, recipientID, timeOfMessage);
	console.log(JSON.stringify(message));
	
	var messageId = message.mid;

	// You may get a text or attachment but not both
	var messageText = message.text;
	var messageAttachments = message.attachments;

	if (messageText) {

	    // If we receive a text message, check to see if it matches any special
	    // keywords and send back the corresponding example. Otherwise, just echo
	    // the text we received.
	    switch (messageText) {
	    case 'image':
		// sendImageMessage(senderID);
		console.log( "messageText is image" );
		break;
	    case 'button':
		console.log( "messageText is button" );
		// sendButtonMessage(senderID);
		break;
	    case 'generic':
		console.log( "messageText is generic" );
		// sendGenericMessage(senderID);
		break;
	    case 'receipt':
		console.log( "messageText is receipt" );
		// sendReceiptMessage(senderID);
		break;
	    default:
		sendTextMessage(senderID, messageText);
	    }
	} else if (messageAttachments) {
	    sendTextMessage(senderID, "Message with attachment received");
	}
    }
    
    function sendTextMessage(recipientId, messageText) {
	var messageData = {
	    recipient: {
		id: recipientId
	    },
	    message: {
		text: messageText
	    }
	};
	callSendAPI(messageData);
    }

    function callSendAPI( messageData ) {
	console.log( "Calling SEND API: ", messageData );
	request({
	    uri: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: { access_token: "EAAY2gddb5DMBAOcgeXrYGdLRTn26JSGyH0DQNsaZAmSLJOZAN7pSX7YXhN5nhnKVcXUOTkfOt8zdDBTPbaIuIa0svrv5UDkJAIXqZAQ1p1AdjsAqXwHTl9ZAEpqHrhGr1UZBSlyMCnoYAv3X2ZBoC8HXEkggCQmpoCDbqndpo3fAZDZD" },
	    method: 'POST',
	    json: messageData
	}, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
		var recipientId = body.recipient_id;
		var messageId = body.message_id;
		
		console.log("Successfully sent generic message with id %s to recipient %s", 
			    messageId, recipientId);
	    } else {
		console.error("Unable to send message.");
		console.error(response);
		console.error(error);
	    }
	});
    }
});

/**
 * @api {post} /user Create a new User
 * @apiVersion 1.0.0
 * @apiName PostUser
 * @apiGroup User
 * @apiPermission none
 *
 * @apiDescription Insert a user
 *
 * @apiExample Example usage:
 * curl -XPOST -H "Content-Type: application/json" -d '{"phone_number": 14085551212, "first_name": "Foo", "last_name": "bar", "default_rate": 10.50, "lat": 37.52, "lng": -121.97234 }' http://nextforce.us/v1/users/
 *
 * @apiParam {Number} phone_number Phone number
 * @apiParam {String} first_name   First name
 * @apiParam {String} last_name    Last name
 * @apiParam {Number} default_rate Default rate
 * @apiParam {Number} lat          Latitude
 * @apiParam {Number} lng          Longitude
 *
 * @apiSuccess {String} id           userid
 * @apiSuccess {Number} phone_number Phone number
 * @apiSuccess {String} first_name   First name
 * @apiSuccess {String} last_name    Last name
 * @apiSuccess {Number} default_rate Default rate
 * @apiSuccess {Number} lat          Latitude
 * @apiSuccess {Number} lng          Longitude
 *
 */
router.post( '/', function( req, res, next ) {
    var phone_number = req.body.phone_number;
    var first_name   = req.body.first_name;
    var last_name    = req.body.last_name;
    var default_rate = req.body.default_rate;
    var lat          = req.body.lat;
    var lng          = req.body.lng;

    if ( ! phone_number || ! first_name || ! last_name || ! default_rate ) {
        console.log( "Invalid user: ", req.body );
        return res.json( { error: 'Invalid user request', message: req.body } );
    }
    
    var post_data    = {
        phone_number: phone_number,
        first_name  : first_name,
        last_name   : last_name,
        default_rate: default_rate,
        lat         : lat,
        lng         : lng,
    };
    var url = Util.getPrivateAPIUrl( '/v1/users_priv/' );
    fetch( url, { method: 'post', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                  body: JSON.stringify( post_data ) })
        .then( function( userPriv ) { return userPriv.json(); })
        .then( function( userJson ) {
            // Insert activation code
            url = Util.getPrivateAPIUrl( '/v1/activations/' );
            fetch( url, { method: 'post', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json'},
                          body: JSON.stringify({ userid: userJson.id }) })
                .then( function( actPriv ) { return actPriv.json(); })
                .then( function( actJson ) { })
                .catch( function( err ) { console.log( "Error: ", err ); });
            
            return res.send( userJson );
        })
        .catch( function( err ) { return res.json( { error: err } ); });
});


router.post( '/exec_script', function( req, res, next ) {
    var script     = req.body.script;
    var language   = req.body.language;
    var problem    = req.body.problem;
    if ( ! script || ! language ) {
        console.log( "Invalid script: ", req.body );
        return res.json( { error: 'Invalid script exec request', message: req.body } );
    }
    var post_data    = {
        script:   script,
        language: language,
        problem: problem,
    };
    var url = Util.getPrivateAPIUrl( '/v1/users_priv/exec_script' );
    fetch( url, { method: 'post', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                  body: JSON.stringify( post_data ) })
        .then( function( userPriv ) { return userPriv.json(); })
        .then( function( userJson ) {
            return res.send( userJson );
        })
        .catch( function( err ) { return res.json( { error: err } ); });
});

/**
 * @api {put} /users/?:id Update Users by userid
 * @apiVersion 1.0.0
 * @apiName PutUser
 * @apiGroup User
 * @apiPermission none
 *
 * @apiDescription Update phone_number, first_name, last_name, default_rate, lat, lng of a user
 *
 * @apiExample Example usage:
 * curl -XPUT -H "Content-Type: application/json" -d '{"first_name": "Baz"}' http://nextforce.us/v1/store_users/?id=6790
 * curl -XPUT -H "Content-Type: application/json" -d '{"phone_number": 14085551212, "last_name": "Baz"}' http://nextforce.us/v1/store_users/?id=6790
 *
 * @apiParam {Number} id userid
 *
 * @apiSuccess {String} id           userid
 * @apiSuccess {Number} phone_number Phone number
 * @apiSuccess {String} first_name   First name
 * @apiSuccess {String} last_name    Last name
 * @apiSuccess {Number} default_rate Default rate
 * @apiSuccess {Number} lat          Latitude
 * @apiSuccess {Number} lng          Longitude
 *
 */
router.put( '/:id', function( req, res, next ) {
    var id       = req.params.id;
    var cols     = { 
        'phone_number': false, 'first_name': false, 'last_name': false, 'default_rate': false,
        'lat': false, 'lng': false, 'language': false
    };
    var put_data = {};

    if ( isNaN( id ) ) {
        console.log( "Invalid id for update user: ", req.body );
        return res.json( [] );
    }
    for( var key in req.body ) {
        if ( key in cols ) {
            put_data[key] = req.body[key];
        }
    }

    if ( Object.keys( put_data ).length <= 0 ) {
        console.log( "No parameters to update device: ", req.body );
        return res.json( [] );
    }
    var url = Util.getPrivateAPIUrl( '/v1/users_priv/' + id );
    fetch( url, { method: 'put', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                  body: JSON.stringify( put_data ) })
        .then( function( userPriv ) { return userPriv.json(); })
        .then( function( userJson ) {
            return res.send( userJson );
        })
        .catch( function( err ) { console.log( "Fetch error: ", err ); return res.json( [] ); });
});

module.exports = router;
