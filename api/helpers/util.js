var fs       = require( 'fs' );
var spawn    = require( 'child_process' ).spawnSync;
var path     = require( 'path' );
var crypto   = require( 'crypto' );
var dotenv   = require( 'dotenv' );

dotenv.load();

// var TWILIO_ACCOUNT_SID      = process.env['TWILIO_ACCOUNT_SID'];
// var TWILIO_AUTH_TOKEN       = process.env['TWILIO_AUTH_TOKEN'];

var util     = {
    getSHA256: function( str ) {
        var shasum   = crypto.createHash('sha256');
        shasum.update( str );
        return shasum.digest( 'base64' );
    },

    randomValueHex: function ( len ) {
        return crypto.randomBytes( Math.ceil( len / 2 ))
            .toString( 'hex' ) // convert to hexadecimal format
            .slice( 0, len );   // return required number of characters
    },

    getTimestamp: function( str ) {
        if ( str ) {
            var dt = new Date( str );
            var ts = dt.getTime();
            if ( ! isNaN( ts ) ) {
                return ts;
            } else {
                return null;
            }
        } else {
            return null;
        }
    },

    getISOTimestamp: function( str ) {
        if ( str ) {
            var dt = new Date( str );
            if ( ! isNaN( dt.getTime() ) ) {
                return dt;
            } else {
                return null;
            }
        } else {
            return null;
        }
    },
    
    getCurrentTimestamp: function() {
        var ts = new Date().getTime();
        return ts;
    },

    // Return time diff in ms
    getTimeDiff: function( start_str, end_str ) {
        var start_dt = new Date( start_str );
        var start_ts = start_dt.getTime();
        var end_dt   = new Date( end_str );
        var end_ts   = end_dt.getTime();
        if ( ! isNaN( start_ts ) && ! isNaN( end_ts ) ) {
            return ( end_ts - start_ts );
        } else {
            return 0;
        }
    },

    isPast: function( ts_str ) {
        var now_dt = new Date();
        var now_ts = now_dt.getTime();
        var ts_dt  = new Date( ts_str );
        var ts     = ts_dt.getTime();
        if ( ! isNaN( ts )) {
            if ( ts > now_ts ) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    },

    getTimeString: function( start_str, end_str ) {
        var now_dt   = new Date();
        var now_ts   = now_dt.getTime();
        var start_dt = new Date( start_str );
        var start_ts = start_dt.getTime();
        var end_dt   = new Date( end_str );
        var end_ts   = end_dt.getTime();
        if ( ! isNaN( start_dt.getTime() ) && ! isNaN( end_dt.getTime() ) ) {
            var start_hrs  = start_dt.getHours();
            var start_ampm = "AM";
            if ( start_hrs >= 12 ) {
                start_hrs  = start_hrs - 12; start_ampm = "PM";
            }
            if ( start_hrs == 0 ) {
                start_hrs  = 12;
            }
            var end_hrs    = end_dt.getHours();
            var end_ampm   = "AM";
            if ( end_hrs >= 12 ) {
                end_hrs    = end_hrs - 12; end_ampm = "PM";
            }
            if ( end_hrs == 0 ) {
                end_hrs = 12;
            }
            return this.getMonthFromMonthIndex( start_dt.getMonth()) + " " + start_dt.getDate() + " " +
                start_hrs + "-" + end_hrs + end_ampm;
        } else {
            return "";
        }
        return "";
    },

    getMonthFromMonthIndex: function( midx ) {
        var marr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
        if ( midx >= 0 && midx <= 11 ) {
            return marr[midx];
        } else {
            return "";
        }
    },

    getLocaleStringFromTimestamp: function( ts ) {
        if ( ! isNaN( ts )) {
            var str = new Date( ts ).toLocaleString();
            return str;
        } else {
            return null;
        }
    },

    getFloatFromAmount: function( amount_str ) {
        var str    = amount_str.replace( '$', '' );
        var amount = parseFloat( str );
        if ( ! isNaN( amount )) {
            return amount;
        } else {
            return 0;
        }
    },
    
    dumbPermuteNumber: function( curr, MAX ) {
        return ( curr + Math.floor( MAX / 2.0 ) ) % MAX;
    },

    getWhereClauseFromParams: function( query, cols, startParamIndex ) {
        var whereClause = "", paramIndex = 1, params = [];
        if ( startParamIndex ) {
            paramIndex   = startParamIndex;
        }
        for ( var key in query ) {
            if ( key in cols ) {
                var val = query[key];
                if ( val ) {
                    if ( val.match( /\,/ )) {
                        var inVals   = val.split( ',' );
                        whereClause += ( whereClause.length <= 0 ) ? key + " in ( " : " and " + key + " in ( ";
                        var inCnt    = 0;
                        inVals.forEach( function( inVal ) {
                            whereClause += ( inCnt == 0 ) ? "$" + paramIndex : ", $" + paramIndex;
                            params.push( inVal );
                            paramIndex++; inCnt++;
                        });
                        whereClause += " ) ";
                    } else {
                        var snippet;
                        if ( cols[key] == 'like' ) {
                            snippet = key + " like $" + paramIndex;
                            params.push( val + '%' );
                        } else {
                            snippet = key + " = $" + paramIndex;
                            params.push( val );
                        }
                        whereClause += ( whereClause.length <= 0 ) ? snippet : " and " + snippet;
                        paramIndex++;
                    }
                }
            }
        }
        return { whereClause: whereClause, params: params, paramIndex: paramIndex };
    },

    getUpdateClauseFromParams: function( query, cols, startParamIndex ) {
        var upClause = "", paramIndex = 1, params = [];
        if ( startParamIndex ) {
            paramIndex   = startParamIndex;
        }
        // iterate through body to construct update clause
        for( var key in query ) {
            if ( key in cols ) {
                var val = query[key];
                if ( val ) {
                    var snippet = key + " = $" + paramIndex;
                    upClause += ( upClause.length <= 0 ) ? snippet : ", " + snippet;
                    params.push( val );
                    paramIndex++;
                }
            }
        }
        // Added updated_at if any fields being updated
        upClause += ( upClause.length <= 0 ) ? "" : ", updated_at = now()";
        return { upClause: upClause, params: params, paramIndex: paramIndex };
    },

    getOrderByClauseFromParams: function( query ) {
        var orderByClause = "";
        if ( query.sortDsc ) {
            var val = query.sortDsc;
            orderByClause += ( orderByClause.length <= 0 ) ? val + " DESC" : "," + val + " DESC";
        } else if ( query.sortAsc ) {
            var val = query.sortAsc;
            orderByClause += ( orderByClause.length <= 0 ) ? val + " ASC" : "," + val + " ASC";
        }
        return orderByClause;
    },

    getDBConnectionString: function( DB ) {
        var env = process.env.NFT_ENV;
        if ( env == 'PRODUCTION' || env == 'STAGING' ) {
            return 'postgres://' + process.env.PGUSER + ':' + process.env.PGPASSWORD + '@' +
                process.env.DB_ENDPOINT + ':5432/' + DB;
        } else {
            return 'postgres://localhost:5432/' + DB;
        }
    },

    getPrivateAPIHost: function() {
        return "localhost";
    },

    getPrivateAPIPort: function() {
        return process.env['API_PORT'];
    },

    getPrivateAPIUrl: function( endpoint ) {
        // return "http://localhost:3000" + endpoint;
        return process.env['API_HOST'] + endpoint;
    },

    getRedisQHost: function() {
        return process.env['REDIS_Q_HOST'];
    },

    getRedisQPort: function() {
        return 6379;
    },

    isInt: function( n ) {
        return n != "" && !isNaN( n ) && Math.round( n ) == n;
    },

    //-------- Utils for executing scripts -----//

    readFile: function( fname, filePath ) {
        if ( ! filePath ) {
            filePath = path.join( __dirname, "../problem_data", fname );
        }
        var retstr = fs.readFileSync( filePath, { encoding: 'utf8' } );
        return retstr;
    },

    writeFile: function( fileStr, fname, filePath ) {
        if ( ! filePath ) {
            filePath = path.join( __dirname, "../problem_data", fname );
        }
        var retstr = fs.writeFileSync( filePath, fileStr, { encoding: 'utf8', mode: 0o644 } );
        return retstr;
    },

    execCmd: function( str, problem, language, srcFile ) {
        var map       = this.languageMap();
        var inputStr  = ( problem && problem.input ) ? problem.input : "";
        var outputStr = ( problem && problem.output ) ? problem.output : "";
        var randStr   = this.randomValueHex( 10 );
        var cmdReturn, srcFile, execable;

        if ( map[language].interpreted ) { // interpreted languages

            execable  = map[language].interpreter;
            if ( ! srcFile ) {
                srcFile  = path.join( __dirname, "../tmp_scripts",
                                       this.randomValueHex( 10 ) + "." + map[language].extension );
            }
            fs.writeFileSync( srcFile, str, { encoding: 'utf8', mode: 0o755 } );
            if ( inputStr && inputStr.length > 0 ) {
                cmdReturn = spawn( execable, [srcFile], { timeout: 10000, input: inputStr } );
            } else {
                cmdReturn = spawn( execable, [srcFile], { timeout: 10000 } );
            }
            fs.unlinkSync( srcFile );
            return cmdReturn;
            
        } else { // compiled languages, compile first, check for errors
            
            compiler    = map[language].compiler;
            compileArgs = map[language].compileArgs;
            execable    = path.join( __dirname, "../tmp_scripts", randStr + "." + map[language].execExtension );
            if ( ! srcFile ) {
                srcFile  = path.join( __dirname, "../tmp_scripts", randStr + "." + map[language].srcExtension );
            }
            fs.writeFileSync( srcFile, str, { encoding: 'utf8', mode: 0o755 } );
            if ( language === 'c++' ) {
                compileArgs.push( "-o" + execable );
            }
            compileArgs.push( srcFile );
            var compileReturn = spawn( compiler, compileArgs, { timeout: 10000 });
            fs.unlinkSync( srcFile );
            if ( compileReturn.status > 0 ) {
                // compile failed
                return compileReturn;
            } else {
                if ( inputStr && inputStr.length > 0 ) {
                    cmdReturn = spawn( execable, [], { timeout: 10000, input: inputStr } );
                } else {
                    cmdReturn = spawn( execable, [], { timeout: 10000 } );
                }
                fs.unlinkSync( execable );
                return cmdReturn;
            }
        }
    },

    languageMap: function() {
        var map = {
            javascript: { interpreted: true, interpreter: 'node', extension: 'js' },
            php:        { interpreted: true, interpreter: 'php', extension: 'php' },
            ruby:       { interpreted: true, interpreter: 'ruby', extension: 'rb' },
            python:     { interpreted: true, interpreter: 'python', extension: 'rb' },
            'c++':      { interpreted: false, compiler: 'g++', compileArgs: ["-Wall", "-std=gnu++11", "-pthread"],
                          srcExtension: 'cpp', execExtension: 'out' },
        };
        return map;
    },

};

module.exports = util;
