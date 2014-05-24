/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var Queue = require('../lib/core/queue-core');
var QueueClient = require('../lib/queue.client.js');
var SocketIoBridgeServer = require('../lib/net/socket-io-bridge-server');
var QueueServer = require('../lib/core/node-queue-server');
var http = require('http');

describe('Interaction of different options clients', function() {

    var coreQueue, server, client;

    beforeEach(function(done) {
        var queueName = 'test';
        var strategy = 'broadcast';
        var port = 8888;
        var url = 'http://localhost:' + port;

        coreQueue = new Queue(queueName, strategy);
        var serverBridge = new SocketIoBridgeServer(port, function() {
            return http.createServer();
        });

        server = new QueueServer( { serverBridge : serverBridge, Queue : Queue } );
        client = new QueueClient( url, queueName, strategy );
        done();
    });

    afterEach(function(done){
        client.close(function(){
            server.close(function(){
                done();
            });
        });
    });

    it('core queue subscriber must receive  message from socketIo client', function(done) {
        var sendData = 1;

        coreQueue.subscribe(function(err, subscriber){
            subscriber.on('data', function(data, accept){
                accept();
                expect(data).toBe(sendData);
                done();
            });
        });

        client.publish(sendData);
    });
});