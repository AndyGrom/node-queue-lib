/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var QueueServer = require('../lib/core/node-queue-server');
var SocketIoBridgeServer = require('../lib/net/socket-io-bridge-server');
var createHttpServer = require('./httpServer');

var server = new QueueServer({
    serverBridge: new SocketIoBridgeServer(8888, function(){
        console.log('server ready');
        return createHttpServer();
    })
});
