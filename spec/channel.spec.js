/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

/*global setImmediate*/

var ClientChannel = require('../lib/net/client-channel');
var ServerChannel = require('../lib/net/server-channel');
var MemoryBridge = require('../lib/net/memory-bridge');
var SocketIoBridgeClient = require('../lib/net/socket-io-bridge-client');
var SocketIoBridgeServer = require('../lib/net/socket-io-bridge-server');

var utils = require('../lib/core/utils');

function testCase(getBridge, description) {
    describe(description, function() {

        var client, server;
        var queueName = 'test-queue';
        var strategy = 'broadcast';
        var clientRequest = {
            queueName: queueName,
            strategy : strategy
        };

        beforeEach(function(done) {
            getBridge(function(clientBridge, serverBridge) {
                client = new ClientChannel(clientBridge);
                server = new ServerChannel(serverBridge);
                server.listen();
                done();
            });
        });

        afterEach(function(done){
            client.destroy(function() {
                server.destroy(done);
            });
        });

        it('publish must rise onPublish action on server', function(done){

            server.on('publish', function(obj, accept){
                expect(obj.queueName).toBe(queueName);
                expect(obj.strategy).toBe(strategy);
                accept();
                done();
            });

            client.publish(clientRequest);
        });

        it('client.subscribe must return subscriber object with on method', function(done){
            server.on('subscribe', function(obj, channel, acceptCallback){
                expect(obj.queueName).toBe(queueName);
                expect(obj.strategy).toBe(strategy);
                acceptCallback();
            });

            client.subscribe(clientRequest, function(err, subscriber) {
                expect(subscriber).toBeDefined();
                expect(subscriber.on).toBeDefined();
                done();
            });
        });

        it('subscribe must rise onSubscribe action on server', function(done){
            server.on('subscribe', function(obj, channel, acceptCallback){
                expect(obj.queueName).toBe(queueName);
                expect(obj.strategy).toBe(strategy);
                acceptCallback();
                done();
            });

            client.subscribe(clientRequest);
        });

        it('client subscriber must receive message and server must receive accept', function(done) {
            var iterationsCount = 2;
            var subscriberData = 1;
            var acceptedData = '';
            var responses = [];

            var onResponse = utils.after(iterationsCount * 2, function(){
                expect(responses.length).toBe(0);
                done();
            });

            server.on('subscribe', function(obj, channel, acceptCallback){
                responses.push(channel.id);
                acceptCallback();
                channel.once('subscriberReady', function(subscriberReadyAccept) {
                    subscriberReadyAccept();
                    channel.write(subscriberData, function(acceptData){
                        expect(acceptData).toBe(acceptedData);
                        responses.splice(responses.indexOf(channel.id),1);
                        onResponse();
                    });
                });
            });


            for(var i = 0; i < iterationsCount; i++) {
                client.subscribe(clientRequest, function(err, subscriber){
                    subscriber.on('data', function(data, acceptCallback){
                        expect(data).toBe(subscriberData);
                        acceptCallback(acceptedData);
                        onResponse();
                    });
                });
            }
        });

        it('client must receive error after channel close', function(done) {
            server.on('subscribe', function(obj, channel, acceptCallback) {
                acceptCallback(null, null, function() {
                    channel.close(function(){});
                });
            });

            client.subscribe(clientRequest, function(err, subscriber){
                subscriber.on('close', function() {
                    done();
                });
            });
        });

        it('server channel must rise "close" event after client do close', function(done) {

            var iterationCount = 5;

            var onClose = utils.after(iterationCount, function(){
                done();
            });

            server.on('subscribe', function(obj, channel, acceptCallback) {
                channel.once('close', function(){
                    onClose();
                });
                acceptCallback();
            });

            for(var i = 0; i < iterationCount; i++) {
                client.subscribe(clientRequest, function(err, subscriber) {
                    subscriber.close();
                });
            }
        });

        var iterations = 10;
        it('performance. multiple(' + iterations + ') publish.', function(done){

            var called = utils.after(iterations, function() {
                done();
            });

            server.on('publish', function(obj, acceptCallback) {
                acceptCallback();
                called();
            });

            utils.asyncLoop(function(index, next) {
                client.publish(clientRequest, function() {
                    setImmediate(function() {
                        index < iterations ? next() : null;
                    });
                });
            });
        });

        it('performance. multiple(' + iterations + ') subscribers.', function(done){

            var called = utils.after(iterations, function(){
                done();
            });

            server.on('subscribe', function(obj, channel, acceptCallback){
                acceptCallback();
                channel.once('subscriberReady', function(subscriberReadyAccept) {
                    subscriberReadyAccept();
                    channel.write(1, function(err, acceptObj, acceptCallback){
                        acceptCallback();
                    });
                    called();
                });
            });

            utils.asyncLoop(function(index, next){
                client.subscribe(clientRequest, function(err, subscriber){
                    subscriber.on('data', function(data, acceptCallback){
                        acceptCallback(null, null, function(){
                            setImmediate(function(){
                                index < iterations ? next() : null;
                            });
                            subscriber.close();
                        });
                    });
                });
            });
        });



    });

}

describe('channel test', function() {
    testCase(function(callback) {
        var bridge = new MemoryBridge();
        callback(bridge, bridge);

    }, 'through memory bridge');
});

describe('channel test', function() {
    testCase(function(callback) {
        var port = 11111;
        var clientBridge = new SocketIoBridgeClient('http://localhost:' + port);
        var serverBridge = new SocketIoBridgeServer(port);

        callback(clientBridge, serverBridge);

    }, 'through socket.io bridge');
});

