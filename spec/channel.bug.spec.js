/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var ClientChannel = require('../lib/net/client-channel');
var ServerChannel = require('../lib/net/server-channel');

var utils = require('../lib/core/utils');
var EventEmitter = require('events').EventEmitter;

var errorObj = 'bug';

describe('channel test', function() {

    describe('through buggy bridge', function() {

        var client, server;

        afterEach(function(done) {
            client.destroy(function() {
                server.destroy(function(){
                    done();
                });
            });
        });

        it('client.publish must return correct error', function(done) {
            var bridge = new BuggyIoBridge();
            client = new ClientChannel(bridge);
            server = new ServerChannel(bridge);
            server.listen();

            server.on('error', function(err) {
            });

            client.publish(1, function(err){
                expect(err).toBe(errorObj);
                done();
            });
        });

        it('client.subscribe must return correct error', function(done){
            var bridge = new BuggyIoBridge();
            client = new ClientChannel(bridge);
            server = new ServerChannel(bridge);
            server.listen();

            server.on('error', function(err) {
            });

            client.subscribe({}, function(err) {
                expect(err).toBe(errorObj);
                done();
            });
        });

        it('client.publish must return correct error during bridge.connect error occur', function(done){

            var bridge = {
                connect : function(callback) {
                    callback(errorObj);
                },
                close : function(callback) {
                    callback();
                }
            };

            client = new ClientChannel(bridge);

            client.publish({}, function(err){
                expect(err).toBe(errorObj);
                done();
            });
        });

        it('client.subscribe must return correct error during bridge.connect error occur', function(done){

            var bridge = {
                connect : function(callback) {
                    callback(errorObj);
                },
                close : function(callback) {
                    callback();
                }
            };

            client = new ClientChannel(bridge);

            client.subscribe({}, function(err) {
                expect(err).toBe(errorObj);
                done();
            });
        });

        it('client.subscribe must return correct error during subscriber error occur', function(done){

            var bridge = {
                connect : function(callback) {
                    var writeCount = 0;
                    var socket = new BugSocket();
                    socket.write = function(data, callback) {
                        writeCount++;
                        if (writeCount === 1) {
                            return callback();
                        }
                        return callback(errorObj);
                    };

                    callback(null, socket);
                },
                close : function(callback) {
                    callback();
                }
            };

            client = new ClientChannel(bridge);

            client.subscribe({}, function(err, subscriber) {
                subscriber.on('error', function(err) {
                    expect(err).toBe(errorObj);
                    done();
                });

                subscriber.on('data');
            });
        });

        it('client.subscribe must return correct error during subscriber error occur on 2 phase', function(done){

            var bridge = {
                connect : function(callback) {
                    var socket = new BugSocket();
                    socket.write = function(data, callback) {
                        return callback();
                    };

                    callback(null, socket);
                },
                close : function(callback) {
                    callback();
                }
            };

            client = new ClientChannel(bridge);

            client.subscribe({}, function(err, subscriber) {
                subscriber.on('error', function(err) {
                    expect(err).toBe(errorObj);
                    done();
                });

                subscriber.on('data');
            });
        });

        it('server.listen must return correct error', function(done){
            var serverBridge = {
                listen : function(callback) {
                    callback(errorObj);
                }
            };

            var server = new ServerChannel(serverBridge);
            server.listen(function(err) {
                expect(err).toBe(errorObj);
                done();
            });
        });

        it('server subscriber read error must emit "close" event', function(done) {
            var serverBridge = {
                listen : function(callback) {
                    function Connection() {}
                    utils.inherits(Connection, EventEmitter);

                    Connection.prototype.read = function(callback) {
                        callback(null, { action : 'subscribe' } );
                        callback(errorObj);
                    };

                    callback(null, new Connection());
                }
            };

            var server = new ServerChannel(serverBridge);
            server.once('error', function() {});
            server.on('subscribe', function(data, subscriber) {
                subscriber.once('error', function(){
                    done();
                })
            });
            server.listen();

        });

    });
});


function BuggyIoBridge() {
    return {
        connect : function(callback) {
            process.nextTick(function(){
                callback(null, new BugSocket());
            });
        },
        listen : function(callback) {
            process.nextTick(function(){
                callback(null, new BugSocket());
            });
        },
        close : bugFunction
    }
}

function bugFunction(callback) {
    process.nextTick(function() {
        callback(errorObj);
    })
}

function BugSocket() {}
utils.inherits(BugSocket, EventEmitter);

BugSocket.prototype.write = function(data, callback){
    bugFunction(callback);
};
BugSocket.prototype.read = bugFunction;
BugSocket.prototype.close = bugFunction;
