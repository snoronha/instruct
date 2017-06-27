'use strict';

var request = require('supertest');
var should  = require('should');
var sinon   = require('sinon');
var Util    = require('../helpers/util.js');

describe( '---- Util functions ----', function () {
    it ( 'should test getSHA256', function ( done ) {
        var hash = Util.getSHA256( "test" );
        hash.length.should.be.greaterThan( 20 );
        done();
    });

    it ( 'should test randomValueHex', function ( done ) {
        Util.randomValueHex( 5 ).length.should.be.equal( 5 );
        done();
    });
    
    it ( 'should test getTimestamp', function ( done ) {
        ( Util.getTimestamp( null ) === null ).should.be.true;
        ( Util.getTimestamp( "junk string" ) === null ).should.be.true;
        Util.getTimestamp( "01/01/2016 08:00:00" ).should.be.greaterThan( 0 );
        done();
    });

    it ( 'should test getISOTimestamp', function ( done ) {
        ( Util.getISOTimestamp( null ) === null ).should.be.true;
        ( Util.getISOTimestamp( "junk string" ) === null ).should.be.true;
        Util.getISOTimestamp( "01/01/2016 08:00:00" ).should.be.not.null;
        done();
    });

    it ( 'should test getCurrentTimestamp', function ( done ) {
        Util.getCurrentTimestamp().should.be.not.null;
        done();
    });

    it ( 'should test getTimeDiff', function ( done ) {
        Util.getTimeDiff( "01/01/2016 08:00:00 AM", "01/01/2016 11:00:00 AM" ).should.be.greaterThan( 0 );
        ( Util.getTimeDiff( "blah blah", "01/01/2016 11:00:00 AM" ) === null ).should.be.true;
        done();
    });

    it ( 'should test isPast', function ( done ) {
        Util.isPast( "01/01/2015 08:00:00 AM" ).should.be.true;
        Util.isPast( "01/01/2020 08:00:00 AM" ).should.be.false;
        Util.isPast( "junk" ).should.be.true;
        done();
    });

    it ( 'should test getTimeString', function ( done ) {
        Util.getTimeString( "01/01/2016 08:00:00 AM", "01/01/2016 11:00:00 AM" ).length.should.be.greaterThan( 0 );
        Util.getTimeString( "01/01/2016 00:00:00 AM", "01/01/2016 11:00:00 AM" ).length.should.be.greaterThan( 0 );
        Util.getTimeString( "01/01/2016 13:00:00", "01/01/2016 17:00:00" ).length.should.be.greaterThan( 0 );
        Util.getTimeString( "01/01/2016 13:00:00", "01/02/2016 00:00:00" ).length.should.be.greaterThan( 0 );
        Util.getTimeString( "junk", "01/02/2016 00:00:00" ).length.should.be.equal( 0 );
        done();
    });

    it ( 'should test getMonthFromMonthIndex', function ( done ) {
        Util.getMonthFromMonthIndex( 5 ).should.be.equal( 'Jun' );
        Util.getMonthFromMonthIndex( 7 ).should.be.equal( 'Aug' );
        Util.getMonthFromMonthIndex( 25 ).should.be.equal( '' );
        done();
    });

    it ( 'should test getLocaleStringFromTimestamp', function ( done ) {
        Util.getLocaleStringFromTimestamp( 1000000000 ).length.should.be.greaterThan( 0 );
        ( Util.getLocaleStringFromTimestamp( "junk" ) === null ).should.be.true;
        done();
    });

    it ( 'should test getFloatFromAmount', function ( done ) {
        Util.getFloatFromAmount( "$27.00" ).should.be.equal( 27.0 );
        Util.getFloatFromAmount( "27.00" ).should.be.equal( 27.0 );
        Util.getFloatFromAmount( "$addfabc" ).should.be.equal( 0 );
        done();
    });

    it ( 'should test dumbPermuteNumber', function ( done ) {
        Util.dumbPermuteNumber( 5, 100 ).should.be.equal( 55 );
        Util.dumbPermuteNumber( 10, 100 ).should.be.equal( 60 );
        done();
    });

    it ( 'should test getWhereClauseFromParams', function ( done ) {
        var query = { id: "1" }, cols = { id: false, userid: false }, startParamIndex = 1;
        Util.getWhereClauseFromParams( query, cols, startParamIndex ).whereClause.length.should.be.greaterThan( 0 );
        query     = { id: "1,2" };
        Util.getWhereClauseFromParams( query, cols, startParamIndex ).whereClause.length.should.be.greaterThan( 0 );
        done();
    });

    it ( 'should test getUpdateClauseFromParams', function ( done ) {
        var query = { id: "1" }, cols = { id: false, userid: false }, startParamIndex = 1;
        Util.getUpdateClauseFromParams( query, cols, startParamIndex ).upClause.length.should.be.greaterThan( 0 );
        done();
    });

    it ( 'should test getOrderByClauseFromParams', function ( done ) {
        var query = { sortDsc: "id" };
        Util.getOrderByClauseFromParams( query ).length.should.be.greaterThan( 0 );
        query     = { sortAsc: "id" };
        Util.getOrderByClauseFromParams( query ).length.should.be.greaterThan( 0 );
        done();
    });

    it ( 'should test getPrivateAPIHost', function ( done ) {
        Util.getPrivateAPIHost().should.equal( 'localhost' );
        done();
    });

    it ( 'should test getPrivateAPIPort', function ( done ) {
        Util.getPrivateAPIPort().should.equal( 3000 );
        done();
    });

    it ( 'should test getPrivateAPIUrl', function ( done ) {
        Util.getPrivateAPIUrl( '/blah' ).should.equal( process.env['API_HOST'] + '/blah' );
        done();
    });

});

