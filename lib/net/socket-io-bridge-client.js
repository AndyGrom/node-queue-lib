/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var util = require('../core/utils');
var EventEmitter = require('events').EventEmitter;
var socketIoClient = require('socket.io-client');
var uuid = require('node-uuid').v4;

var connections = [];
var sockets = [];
function SocketIoBridgeClient(url) {
    this.url = url;
    EventEmitter.call(this);
}

util.inherits(SocketIoBridgeClient, EventEmitter);

SocketIoBridgeClient.prototype.connect = function (callback) {
    var self = this;

    var socket = socketIoClient.connect(self.url);
    if (sockets.indexOf(socket) === -1) {
        sockets.push(socket);
    }

    if (!socket.socket.connected) {
        socket.once('connect', function() {
            self.onConnect(socket, callback);
        });
        if (!socket.socket.connecting) {
            socket.socket.connect();
        }
    } else {
        self.onConnect(socket, callback);
    }
};

SocketIoBridgeClient.prototype.onConnect = function(socket, callback) {
    var id = uuid();

    socket.emit('new', id);
    socket.once('new' + id, function() {
        var connection = new ClientConnection(socket, id);
        connections.push(connection);
        callback && callback(null, connection);
    });
}

SocketIoBridgeClient.prototype.close = function(callback) {
    this.removeAllListeners();
    (function next(connection) {
        if (connection) {
            connection.close(function(){
                next(connections.pop());
            });
        } else {
            sockets.forEach(function(socket){
                socket.removeAllListeners();
            });
            callback && callback();
        }
    })(connections.pop());
};

function ClientConnection(socket, id) {
    EventEmitter.call(this);
    this.id = id;
    this.socket = socket;
    this.connected = true;
    var self = this;

    socket.once('disconnect', function(){
        self.emit('close', 'disconnect');
    });
    socket.once('close' + this.id, function() {
        self.emit('close', 'close');
    });

}

util.inherits(ClientConnection, EventEmitter);

ClientConnection.prototype.read = function(callback) {
    var self = this;

    self.socket.on('event' + self.id, function(data) {
        var msgId = data.id;
        callback(null, data.value, function(err, acceptData, acceptCallback) {
            self.socket.once('accept' + msgId, function(acceptData) {
                acceptCallback && acceptCallback(acceptData);
            });
            self.socket.emit('accept' + msgId, {err : err, data : acceptData });
        });
    });
};

ClientConnection.prototype.write = function(data, acceptCallback) {
    var self = this;
    var id = uuid();
    self.socket.emit('event' + self.id, { id: id, value: data });
    self.socket.once('accept' + id, function(acceptData) {
        var err  = acceptData.err;
        var data = acceptData.data;
        acceptCallback(err, data);
    });
};

ClientConnection.prototype.close = function(callback) {
    if (this.connected) {
        var self = this;
        if (self.socket.socket.connected) {
            self.socket.emit('close' + self.id);
            self.connected = false;
            self.socket.once('close' + self.id, function(){
                self.removeAllListeners();
                callback && callback();
            });
            return;
        } else {
            self.connected = false;
            self.removeAllListeners();
        }
    }

    callback && callback();
};


module.exports = SocketIoBridgeClient;
