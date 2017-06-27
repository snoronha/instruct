'use strict';

var request = require('supertest');
var should  = require('should');
var app     = require( '../app.js' );

describe( '---- GET /v1/users ----', function () {
    it ( 'should GET /v1/users/?id=6806 and succeed', function ( done ) {
        request( app )
            .get( '/v1/users/?id=6806' )
            .expect( 'Content-Type', /json/ )
            .expect( 200 )
            .end(function ( err, resBlob ) {
                var res  = JSON.parse( resBlob.text );
                res.length.should.be.greaterThan( 0 );
                var user = res[0];
                should.exist( user.first_name );
                user.first_name.length.should.be.greaterThan( 0 );
                done();
            });
    });

});

