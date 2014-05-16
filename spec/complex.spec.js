/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var SocketIoBridgeServer = require('../lib/net/socket-io-bridge-server');
var http = require('http');
var QueueServer = require('../lib/core/node-queue-server');
var utils = require('../lib/core/utils');

var port = 80;

var serverBridge = new SocketIoBridgeServer(port, function() {
    return http.createServer();
});

var server = new QueueServer( { serverBridge : serverBridge } );

var SocketIoBridgeClient = require('../lib/net/socket-io-bridge-client');
var QueueClient = require('../lib/core/node-queue-client');

describe('multiple connections simulation', function(){
    afterEach(function(done) {
        server.close(done);
    });

    it('broadcast strategy', function(done){
        var url = 'http://localhost';
        var clientBridge = new SocketIoBridgeClient(url);

        var settings = {
            queueName : 'test',
            strategy : 'broadcast',
            clientBridge : clientBridge
        };

        utils.asyncLoop(function(index, next) {
            if (index < 3) {
                var queue = new QueueClient( settings );
                queue.subscribe(function (err, subscriber) {
                    subscriber.on('data', function (data, accept) {
                        expect(data).toBe('test');
                        accept();
                        queue.close();
                        next();
                    });
                });
                queue.publish('test');
            } else {
                done();
            }
        });

    });
});