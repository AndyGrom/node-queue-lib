/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var socketIoServer = require('socket.io');
var http = require('http');
var uuid = require('node-uuid').v4;

function SocketIoBridgeServer(port, createHttpServer) {
    if (!createHttpServer) {
        this.httpServer = http.createServer();
    } else {
        this.httpServer = createHttpServer();
    }

    var server = socketServer(port, this.httpServer);
    var socket;
    return {
        listen : function(callback) {
            server.listen(function(serverSocket) {
                socket = serverSocket;
                socket.on('new', function(id) {
                    socket.emit('new' + id, id);
                    callback(null, new ServerConnection(socket, id));
                });
            });
        },
        close: function(callback) {
            socket.removeAllListeners('new');
            server.close(callback);
        }
    };
}

function ServerConnection(socket, id) {
    EventEmitter.call(this);
    this.id = id;
    this.waitEvents = [];
    this.socket = socket;

    var self = this;

    this.onCloseEvent = function() {
        self.emit('close');
        self.cleanListeners();
    }

    this.socket.once('disconnect', this.onCloseEvent);

    this.socket.once('close' + this.id, this.onCloseEvent);
}

util.inherits(ServerConnection, EventEmitter);

ServerConnection.prototype.read = function(callback) {
    var self = this;
    this.onEventFunction = function(data) {
        callback(null, data.value, function(err, acceptData, acceptCallback) {
            self.socket.emit('accept' + data.id, { err: err, data: acceptData });
            acceptCallback && acceptCallback();
        });
    };

    self.socket.on('event' + self.id, this.onEventFunction);
};

ServerConnection.prototype.write = function(data, acceptCallback) {
    var self = this;
    var id = uuid();
    self.socket.emit('event' + self.id, { id: id, value: data });

    var acceptEvent = {
        obj : self.socket,
        event : 'accept' + id,
        fn : function(acceptData) {
            acceptCallback(acceptData.err, acceptData.data, function() {
                self.socket.emit('accept' + id);
            });
        }
    };

    self.socket.once(acceptEvent.event, acceptEvent.fn);
    self.waitEvents.push(acceptEvent);
};

ServerConnection.prototype.close = function(callback) {
    var self = this;
    self.socket.emit('close' + this.id);
    self.cleanListeners();
    callback && callback();
};

ServerConnection.prototype.cleanListeners = function() {
    this.removeAllListeners();
    if (this.onEventFunction) {
        this.socket.removeListener('event' + this.id, this.onEventFunction);
    }
    this.socket.removeListener('close' + this.id, this.onCloseEvent);
    this.socket.removeListener('disconnect', this.onCloseEvent);

    while (this.waitEvents.length) {
        var event = this.waitEvents.pop();
        event.obj.removeListener.call(event.obj, event.event, event.fn);
    };
    delete this.waitEvents;
}


function socketServer(port, httpServer) {
    var io = socketIoServer.listen(httpServer);
    io.set('log level', 1);
    var socketList = [];

    return {
        listen: function(onConnectionCallback) {
            io.server.listen(port, function(){
                io.on('connection', function(socket) {
                    socketList.push(socket);
                    socket.once('disconnect', function () {
                        socket.removeAllListeners();
                        socketList.splice(socketList.indexOf(socket), 1);
                    });
                    onConnectionCallback(socket);
                });
            });
        },
        close : function(onCloseCallback) {
            (function next(socket){
                if (socket) {
                    socket.removeAllListeners();
                    socket.once('disconnect', function() {
                        next(socketList.pop());
                    });
                    socket.disconnect();
                } else {
                    io.server.close();
                    io.server.once('close', function(){
                        io = null;
                        onCloseCallback && onCloseCallback();
                    });
                }
            })(socketList[0]);
        }
    }
}


module.exports = SocketIoBridgeServer;


