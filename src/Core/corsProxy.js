"use strict";

/*global require,URI*/

var defined = require('../../third_party/cesium/Source/Core/defined');

var corsProxy = {
    getURL : function(resource, proxyFlag) {
        var flag = (proxyFlag === undefined) ? '' : '_' + proxyFlag + '/';
        return '/proxy/' + flag + resource;
    },
    proxyDomains : []
};

corsProxy.shouldUseProxy = function(url) {

    var uri = new URI(url);
    var host = uri.host();
    var proxyAvail = proxyAllowedHost(host, corsProxy.proxyDomains);
    var corsAvail = proxyAllowedHost(host, corsProxy.corsDomains);

    if (proxyAvail && !corsAvail) {
//        console.log('PROXY:', host);
        return true;
    }
//    console.log('CORS:', host);
    return false;
};


//Non CORS hosts we proxy to
function proxyAllowedHost(host, domains) {
    if (!defined(domains)) {
        return false;
    }

    host = host.toLowerCase();
    //check that host is from one of these domains
    for (var i = 0; i < domains.length; i++) {
        if (host.indexOf(domains[i], host.length - domains[i].length) !== -1) {
            return true;
        }
    }
    return false;
}


corsProxy.setProxyList = function(proxyDomains, corsDomains, alwaysUseProxy) {
    corsProxy.proxyDomains = proxyDomains;
    corsProxy.corsDomains = corsDomains;
    if (alwaysUseProxy) {
        proxyDomains.concat(corsDomains);
        corsDomains = [];
    }
};


module.exports = corsProxy;
