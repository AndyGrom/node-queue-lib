/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */



var util = require('util');
var EventEmitter = require('events').EventEmitter;

function MemoryBridge() {
    EventEmitter.call(this);
}

util.inherits(MemoryBridge, EventEmitter);

MemoryBridge.prototype.connect = function (callback) {
    var bridge = this;
    process.nextTick(function () {

        var client = new Client();
        var server = new Server();

        server.read = function (callback) {
            server.on('serverData', function (err, data, acceptCallback) {
                callback(err, data, function(err, acceptData, callback) {
                    acceptCallback && acceptCallback(err, acceptData, callback);
                });
            });
            server.once('clientClose', function () {
                server.removeAllListeners('serverData');
                server.emit('close');
            });
        };

        server.write = function (data, accept) {
            process.nextTick(function () {
                client.emit('clientData', null, data, accept);
            });
        };

        server.close = function (callback) {
            client.emit('serverClose');
            server.removeAllListeners();
            callback && callback();
        };

        server.once('clientClose', function(){
            server.emit('close', 'connection close');
            server.removeAllListeners();
        });

        client.read = function (callback) {
            client.on('clientData', function (err, data, acceptCallback) {
                callback(err, data, function(err, acceptData, callback){
                    acceptCallback && acceptCallback(err, acceptData, callback);
                });
            });
        };

        client.write = function (data, accept) {
            process.nextTick(function () {
                server.emit('serverData', null, data, accept);
            });
        };

        client.close = function (callback) {
            server.emit('clientClose');
            client.removeAllListeners();
            callback && callback();
        };

        client.once('serverClose', function(){
            client.emit('close', 'connection close');
            client.removeAllListeners();
        });

        var connectionListener = bridge.listeners('connection')[0];
        connectionListener(null, server);
        callback(null, client);
    });
};

MemoryBridge.prototype.listen = function (callback) {
    this.on('connection', callback);
};

MemoryBridge.prototype.close = function(callback) {
    process.nextTick(function(){
        callback();
    })
};

function Client() {
    EventEmitter.call(this);
}

function Server() {
    EventEmitter.call(this);
}

util.inherits(Client, EventEmitter);
util.inherits(Server, EventEmitter);


module.exports = MemoryBridge;