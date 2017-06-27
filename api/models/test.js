var mongoose = require( 'mongoose' );
var Problem  = require( './problem' );

var problems = [
    new Problem({
	subdomain: 'arrays',
	description: [
	    "You are given an array of integers of size N. Can you find the sum of the elements in the array?",
            "<p><b>Input</b><br/>",
            "The first line of input consists of an integer N. The next line contains N space-separated integers representing the array elements.<br/></p>",
            "<p>Sample: <br/>",
            "6<br/>",
            "1 2 3 4 10 11<br/></p>",
            "<p><b>Output</b><br/",
            "Output a single value equal to the sum of the elements in the array.<br/>",
            "For the sample please print 31 as 1 + 2 + 3 + 4 +10 +11 = 31."
	],
	input: [
	    "6",
            "1 2 3 4 10 11"
	],
	output: [
	    "31"
	],
	created_at: new Date(),
	updated_at: new Date()
    }),
    new Problem({
	subdomain: 'primitive types',
	description: [
	    "Find the Parity of a number. The Parity of a number is 1 if the binary representation has an odd number of 1's and 0 if the number of 1's is even. You input is the decimal representation of the number.",
            "<p><b>Input</b><br/>",
            "First Line: decimal representation of the number.<br/></p>",
            "<p>Sample: <br/>",
            "15<br/></p>",
            "<p><b>Output</b><br/",
            "Output a single value equal to the parity of the number.<br/>",
            "For the sample above please print 0 because Parity( 15 (decimal) ) = Parity( 1111 ) = 0."
	],
	input: [
	    "15"
	],
	output: [
	    "0"
	],
	created_at: new Date(),
	updated_at: new Date()
    })
];

mongoose.connect('mongodb://mongo-dev.menturing.com/menturing');
for( var idx in problems ) {
    var problem = problems[idx];
    problem.save( function( err ) {
	if ( err ) {
	    console.log( "ERROR: ", err );
	} else {
	    console.log( 'Problem 1 saved successfully!' );
	}
    });
}
