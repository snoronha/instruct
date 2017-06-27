(function (window, angular, undefined) {

    angular.module('coderServices').service('Browser', [
        '$window', '$log', 
        function( $window, $log ) {
            
            var that = this;

            this.getBrowser = function() {
                var browser   = "", vendor = $window.navigator.vendor;
                var userAgent = $window.navigator.userAgent, platform = $window.navigator.platform;
                if ( vendor && vendor.match( /google/i )) {
                    browser   = "Chrome";
                } else if ( vendor && vendor.match( /apple/i )) {
                    browser   = "Safari";
                    if ( platform && platform.match( /ipad/i )) {
                        browser = "mobile-" + browser;
                    }
                } else if ( vendor && vendor.match( /opera/i )) {
                    browser   = "Opera";
                } else if ( userAgent && userAgent.match( /firefox/i )) {
                    browser   = "Firefox";
                } else if ( userAgent && userAgent.match( /chrome/i )) {
                    browser   = "Chrome";
                } else if ( userAgent && userAgent.match( /trident/i )) {
                    browser   = "IE";
                } else {
                    browser   = userAgent;
                }
                return browser;
            };

            this.getBrowserVersion = function() {
                var version   = '';
                var vendor    = $window.navigator.vendor ? $window.navigator.vendor : '';
                var userAgent = $window.navigator.userAgent ? $window.navigator.userAgent : '';
                var match;
                if (vendor.match(/google/i)) {
                    match = userAgent.match(/chrome\/(\w+)/i);
                    if (match && match.length > 1 && match[1]) { version = parseFloat(match[1]); }
                } else if (vendor.match(/apple/i)) {
                    match = userAgent.match(/version\/([\w\.]+)/i);
                    if (match && match.length > 1 && match[1]) { version = parseFloat(match[1]); }
                } else if (vendor.match(/opera/i)) {
                    match = userAgent.match(/opr\/(\w+)/i);
                    if (match && match.length > 1 && match[1]) { version = parseFloat(match[1]); }
                } else if (userAgent.match(/Firefox/i)) {
                    match = userAgent.match(/firefox\/([\w\.]+)/i);
                    if (match && match.length > 1 && match[1]) { version = parseFloat(match[1]); }
                } else if (userAgent.match(/Chrome/i)) {
                    match = userAgent.match(/chrome\/(\w+)/i);
                    if (match && match.length > 1 && match[1]) { version = parseFloat(match[1]); }
                } else if (userAgent.match(/Trident/i)) {
                    match = userAgent.match(/trident\/([\w\.]+)/i); // 4 <-> 8, 5 <-> 9 ... 7 <-> 11                    
                    if (match && match.length > 1 && match[1]) { version = parseFloat(match[1]) + 4; }
                }
                return version;
            };            

            this.getOS = function( nav ) {
                // given the navigator object determine OS
                if (! nav) {
                    return 'Unknown OS';
                }
                var appVersion = nav.appVersion ? nav.appVersion : '';
                var platform   = nav.platform ? nav.platform : '';
                var oscpu      = nav.oscpu ? nav.oscpu : '';
                if (oscpu) {
                    // only exists on Firefox on Windows
                    return oscpu;
                }
                if (! appVersion) {
                    return platform;
                }
                var match = appVersion.match(/\((.*?)\)/);
                if (match && match.length > 0) {
                    return match[1];
                } else {
                    return appVersion;
                }
            };

            this.isMobile = function(type) {
                var ua    = $window.navigator.userAgent ? $window.navigator.userAgent : '';
                var isMob = false;
                switch ( type ) {
                case 'android':
                    if ( ua.match(/android/i) && !ua.match(/silk/i) ) {
                        isMob = true;
                    } else {
                        isMob = false;
                    }
                    break;
                case 'kindle':
                    if ( ua.match(/silk/i) ) {
                        isMob = true;
                    } else {
                        isMob = false;
                    }
                    break;
                case 'ios':
                    if ( ua.match(/iphone|ipod/i) ) {
                        isMob = true;
                    } else {
                        isMob = false;
                    }
                    break;            
                case 'ipad':
                    if ( ua.match(/ipad/i) ) {
                        isMob = true;
                    } else {
                        isMob = false;
                    }
                    break;
                case 'windows':
                    if ( ua.match(/iemobile/i) ) {
                        isMob = true;
                    } else {
                        isMob = false;
                    }
                    break;
                case 'blackberry':
                    if ( ua.match(/blackberry/i) ) {
                        isMob = true;
                    } else {
                        isMob = false;
                    }
                    break;
                    // case 'ios':   isMob = true; break;
                }
                return isMob;
            };

        }
    ]);
})(window, window.angular);
