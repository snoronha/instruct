var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var connection    = mongoose.createConnection( "mongodb://mongo-dev.menturing.com/menturing" );

// create problem schema
var problemSchema = new Schema({
    subdomain: String,
    description: [ String ],
    input: [ String ],
    output: [ String ],
    created_at: Date,
    updated_at: Date
});

var Problem = mongoose.model( 'Problem', problemSchema );

module.exports = Problem;
