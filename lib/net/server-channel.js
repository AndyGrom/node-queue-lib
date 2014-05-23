/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */


var util = require('util');
var EventEmitter = require('events').EventEmitter;

function ServerChannel(bridge) {
    this.bridge = bridge;
}

util.inherits(ServerChannel, EventEmitter);

ServerChannel.prototype.listen = function(callback) {
    var self = this;
    this.bridge.listen(function(err, connection) {
        if (err) { return callback && callback(err); }
        onConnect(self, connection);
    });
};

ServerChannel.prototype.destroy = function(callback) {
    this.bridge.close(callback);
}

function onConnect(self, connection) {
    var subscriber;
    connection.read(function(err, data, acceptCallback){
        if (err) {
            self.emit('error', err);
            subscriber && subscriber.emit('error');
            return;
        }
        switch (data.action) {
            case 'publish' :
                self.emit(data.action, data, function(err) {
                    acceptCallback(err);
                    connection.close();
                });
                break;
            case 'subscribe' :
                subscriber = new ServerSubscriber(connection);
                self.emit(data.action, data, subscriber, acceptCallback);
                break;
            case 'count' :
                self.emit(data.action, data, function(err, data){
                    acceptCallback(err, data);
                });
                break;
            case 'subscriberReady' :
                subscriber && subscriber.emit(data.action, function(err) {
                    acceptCallback(err);
                });
        }
    });
    connection.once('close', function(){
        subscriber && subscriber.emit('close');
    });
}

var channelId = 0;
function ServerSubscriber(connection) {
    EventEmitter.call(this);
    var self = this;
    this.connection = connection;
    this.id = ++channelId;
    connection.once('close', function(){
        self.emit('close');
    });
};

util.inherits(ServerSubscriber, EventEmitter);

ServerSubscriber.prototype.write = function(data, acceptCallback) {
    this.connection.write(data, function(err, acceptObj, callback) {
        acceptCallback && acceptCallback(err, acceptObj, callback)
    });
};

ServerSubscriber.prototype.close = function(callback){
    this.connection.close(callback);
}


module.exports = ServerChannel;