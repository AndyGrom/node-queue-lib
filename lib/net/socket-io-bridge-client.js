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
};

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
    this.waitEvents = [];
    var self = this;

    this.onDisconnectEvent = function() {
        self.emit('close', 'close');
        self.cleanListeners();
    };

    socket.once('disconnect', this.onDisconnectEvent);

    this.onCloseEvent = function() {
        self.emit('close', 'close');
        self.cleanListeners();
    };

    socket.once('close' + this.id, this.onCloseEvent);
}

util.inherits(ClientConnection, EventEmitter);

ClientConnection.prototype.read = function(callback) {
    var self = this;

    self.onDataEvent = function (data) {
        var msgId = data.id;
        callback(null, data.value, function(err, acceptData, acceptCallback) {

            var onAcceptEvent = function(acceptData) {
                acceptCallback && acceptCallback(acceptData);
            };

            var acceptEvent = {
                obj : self.socket,
                event : 'accept' + msgId,
                fn : onAcceptEvent
            };

            self.socket.once(acceptEvent.event, acceptEvent.fn);
            self.waitEvents.push(acceptEvent);

            self.socket.emit('accept' + msgId, {err : err, data : acceptData });
        });
    };

    self.socket.on('event' + self.id, self.onDataEvent);
};

ClientConnection.prototype.write = function(data, acceptCallback) {
    var self = this;
    var id = uuid();
    self.socket.emit('event' + self.id, { id: id, value: data });

    var acceptEvent = {
        obj : self.socket,
        event : 'accept' + id,
        fn : function(acceptData) {
            acceptCallback(acceptData.err, acceptData.data);
        }
    };

    self.socket.once(acceptEvent.event, acceptEvent.fn);
    self.waitEvents.push(acceptEvent);
};

ClientConnection.prototype.close = function(callback) {
    var connectionIndex = connections.indexOf(this);
    if (connectionIndex > -1) {
        connections.splice(connectionIndex, 1);
    }

    if (this.connected) {
        var self = this;
        if (self.socket.socket.connected) {
            self.connected = false;
            self.socket.emit('close' + self.id);
            self.cleanListeners();
        } else {
            self.connected = false;
            self.cleanListeners();
        }
    }

    callback && callback();
};

ClientConnection.prototype.cleanListeners = function() {
    this.removeAllListeners();
    if (this.onDataEvent) {
        this.socket.removeListener('event' + this.id, this.onDataEvent);
    }
    this.socket.removeListener('close' + this.id, this.onCloseEvent);
    this.socket.removeListener('disconnect', this.onDisconnectEvent);

    if (this.waitEvents) {
        while (this.waitEvents.length) {
            var event = this.waitEvents.pop();
            event.obj.removeListener.call(event.obj, event.event, event.fn);
        };
        delete this.waitEvents;
    }
};


module.exports = SocketIoBridgeClient;
