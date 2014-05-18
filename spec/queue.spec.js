/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var Queue = require('../lib/core/queue-core');
var utils = require('../lib/core/utils');

var QueueServer = require('../lib/core/node-queue-server');
var QueueClient = require('../lib/core/node-queue-client');
var MemoryBridge = require('../lib/net/memory-bridge');
var SocketIoBridgeClient = require('../lib/net/socket-io-bridge-client');
var SocketIoBridgeServer = require('../lib/net/socket-io-bridge-server');
var QueueStorage = require('../lib/core/memory-storage');
var http = require('http');

var testCase = require('./queue.case.js');

function runTestCase(createQueueFunction) {

    var queue;

    afterEach(function (done) {
        queue.client.close(function(){
            queue.server.close(done);
        });
    });

    testCase(function(strategy, callback){
        queue = createQueueFunction(strategy);
        callback(queue);
    });
}

var queueNum = 0;

describe('Queue core test', function () {
    runTestCase(function (strategy) {
        var name = 'queue' + queueNum++;

        var queue = new Queue(name, strategy);
        return {
            client : queue,
            server : queue
        }
    });
});

describe('node.js client through memory bridge', function () {
    runTestCase(function (strategy) {
        var name = 'queue' + queueNum++;

        var memoryBridge = new MemoryBridge();

        var settings = {
            queueName: name,
            strategy: strategy,
            clientBridge: memoryBridge,
            serverBridge: memoryBridge
        };

        return {
            client : new QueueClient(settings),
            server : new QueueServer(settings)
        };

    });
});

describe('node.js client through socket.io bridge', function () {

    runTestCase(function (strategy) {
        var name = 'queue' + queueNum++;

        var bridge = createSocketIoBridge();

        var settings = {
            queueName : name,
            strategy : strategy,
            clientBridge: bridge.client,
            serverBridge: bridge.server
        };

        return {
            client : new QueueClient(settings),
            server : new QueueServer(settings)
        };

    });
});

function createSocketIoBridge() {
    var port = 12346;

    var clientBridge = new SocketIoBridgeClient('http://localhost:' + port);
    var serverBridge = new SocketIoBridgeServer(port, function(){
        return http.createServer();
    });

    return {
        client : clientBridge,
        server : serverBridge
    }
}



