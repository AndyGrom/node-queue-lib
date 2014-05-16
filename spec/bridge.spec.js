/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

/*global setImmediate*/
var MemoryBridge = require('../lib/net/memory-bridge');
var SocketIoBridgeClient = require('../lib/net/socket-io-bridge-client');
var SocketIoBridgeServer = require('../lib/net/socket-io-bridge-server');
var utils = require('../lib/core/utils');

function testCase(createBridgeFunction){

        var client;
        var server;

        beforeEach(function(done){
            createBridgeFunction(function(clientBridge, serverBridge) {
                client = clientBridge;
                server = serverBridge;
                done();
            });
        });

        afterEach(function(done){
            server.close(function() {
                client.close(function(){
                    done();
                });
            });
        });

        it('server must receive client data and client must receive accepted data', function(done) {

            var acceptData = 1;

            server.listen(function(err, connection) {
                connection.read(function(err, data, acceptedCallback) {
                    expect(data).toBeDefined();
                    acceptedCallback(null, acceptData);
                });
            });

            client.connect(function(err, connection){
                connection.write({}, function(err, data){
                    expect(data).toBe(acceptData);
                    done();
                });
            });
        });

        it('client must receive server data and server must receive accepted data', function(done){
            var acceptData = 1;

            server.listen(function(err, connection) {
                connection.write({}, function(err, data) {
                    expect(data).toBe(acceptData);
                    done();
                });
            });

            client.connect(function(err, connection) {
                connection.read(function(err, data, accept){
                    expect(err).toBeNull();
                    expect(data).toBeDefined();
                    accept(null, acceptData);
                });
            });
        });

        it('client method connection.close must rise server close event', function(done){
            server.listen(function(err, connection){
                connection.read();
                connection.on('close', function() {
                    done();
                });

            });

            client.connect(function(err, connection){
                connection.close();
            });
        });

        it('client reader accept function must be asynchronous', function(done){
            var acceptData = 1;

            server.listen(function(err, connection) {
                connection.write({}, function(err, acceptedObj, acceptCallback) {
                    expect(acceptedObj).toBe(acceptData);
                    acceptCallback();
                });
            });

            client.connect(function(err, connection) {
                connection.read(function(err, data, accept){
                    expect(err).toBeNull();
                    expect(data).toBeDefined();
                    accept(null, acceptData, function(){
                        done();
                    });
                });
            });

        });

        var iterations = 10;
        it('performance. multiple(' + iterations + ') send with one connection. (' + iterations + ') iterations total', function(done){

            var called = utils.after(iterations, function(){
                done();
            });

            server.listen(function(err, connection){
                connection.read(function(err, data, acceptedCallback){
                    acceptedCallback();
                    called();
                });
            });

            client.connect(function(err, connection) {
                utils.asyncLoop(function(index, next) {
                    connection.write(1, function() {
                        index < iterations ? next() : null;
                    });
                });
            });
        });

        it('multiple connections must multiple rise listen callback', function(done) {

            var connectionCount = 2;

            var onConnection = utils.after(connectionCount, function() {
                done();
            });

            server.listen(function(err, connection) {
                expect(connection).toBeDefined();
                onConnection();
            });

            utils.asyncLoop(function(index, next) {
                client.connect(function(err, connection) {
                    expect(err).toBeNull();
                    expect(connection).toBeDefined();
                    connection.close(function() {
                        setImmediate(function() {
                            index <= connectionCount ? next() : null;
                        });
                    });
                });
            });
        });

        var iterations2 = 10;
        var connections = 10;
        it('performance. multiple(' + iterations2 + ') client send through multiple(' + connections + ') connection. (' + (iterations2 * connections)  + ') iterations total', function(done){

            var called = utils.after(iterations2 * connections, function(){
                done();
            });

            server.listen(function(err, connection){
                connection.read(function(err, data, acceptedCallback){
                    acceptedCallback();
                    called();
                });
            });

            for(var i = 0; i <  connections; i++ ) {
                client.connect(function(err, connection){
                    utils.asyncLoop(function(index, nextSend){
                        connection.write(1, function(){
                            setImmediate(function(){
                                index < iterations2 ? nextSend() : null;
                            });
                        });
                    });
                });
            }
        });

        it('client subscriber must receive message and server must receive accept', function(done){

            var acceptData = 2;
            connections = 5;

            var called = utils.after(connections, function(){
                done();
            });

            server.listen(function(err, connection) {
                connection.write(1, function(acceptedData) {
                    expect(acceptedData).toBe(acceptData);
                    called();
                });
            });

            for(var i = 0; i <  connections; i++ ) {
                client.connect(function(err, connection) {
                    connection.read(function(err, data, acceptCallback) {
                        expect(err).toBeNull();
                        expect(data).toBeDefined();
                        acceptCallback(acceptData);
                    });
                });
            }
        });

        it('connections must be separate', function(done) {

            var result = [];
            var connectionIndex = 0;
            var connectionCount = 10;
            var called = utils.after(connectionCount, function(){
                for(var i = 1; i <= connectionCount; i++) {
                    expect(result[i]).toBe(i);
                }
                done();
            });

            server.listen(function(err, connection) {
                connectionIndex++;
                connection.read(function(err, data, acceptedCallback){
                    result[connectionIndex] = data;
                    acceptedCallback();
                    called();
                });
            });

            utils.asyncLoop(function(index, next){
                if (index <= connectionCount) {
                    client.connect(function(err, connection){
                        connection.write(index, function(){
                            connection.close();
                            next();
                        });
                    });
                }
            });
        });
}

describe('Memory bridge test.', function() {
    testCase(function(callback){
        var bridge = new MemoryBridge();
        callback(bridge, bridge);
    })
});

describe('Socket.IO bridge test.', function() {
    var port = 12345;
    var url = 'http://localhost:' + port;

    testCase(function(callback){
        var client = new SocketIoBridgeClient(url);
        var server = new SocketIoBridgeServer(port);
        callback(client, server);
    });
});
