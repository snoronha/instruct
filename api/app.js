var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');

var users_v1            = require('./routes/users_v1');
var messages_v1         = require('./routes/messages_v1');

var users_priv_v1       = require('./routes/users_priv_v1');
var messages_priv_v1    = require('./routes/messages_priv_v1');


var app          = express();
// app.listen( 3000 );

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/../favicon.ico'));
app.use( logger('dev') );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( cookieParser());
app.use( express.static( path.join(__dirname, 'public' )));

app.use( '/v1/users', users_v1 );
// app.use( '/v1/sessions', sessions_v1 );
app.use( '/v1/messages', messages_v1 );

app.use( '/v1/users_priv', users_priv_v1 );
// app.use( '/v1/sessions_priv', sessions_priv_v1 );
app.use( '/v1/messages_priv', messages_priv_v1 );

// catch 404 and forward to error handler
app.use( function( req, res, next ) {
    var err = new Error('Not Found');
    err.status = 404;
    next( err );
});

// error handlers

// development error handler
// will print stacktrace
if ( app.get('env') === 'development' ) {
    app.use( function( err, req, res, next ) {
        res.status( err.status || 500 );
        res.render( 'error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use( function( err, req, res, next ) {
    res.status( err.status || 500 );
    res.render( 'error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
