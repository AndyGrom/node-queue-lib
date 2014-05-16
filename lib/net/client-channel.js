/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var util = require('../core/utils');
var EventEmitter = require('events').EventEmitter;

module.exports = function(bridge) {
    return {
        publish : function(data, callback) {
            bridge.connect(function(err, connection) {
                if (err) { return callback(err); }

                data.action = 'publish';
                connection.write(data, function(err, data) {
                    callback && callback(err, data);
                });
                return null;
            });
        },
        subscribe : function(data, callback) {
            bridge.connect(function(err, connection) {
                if (err) { return callback(err); }

                data.action = 'subscribe';
                connection.write(data, function(err, acceptedData, acceptedCallback) {
                    var clientSubscriber = new ClientSubscriber(data.queueName, connection);
                    callback && callback(err, err ? null : clientSubscriber);
                    acceptedCallback && acceptedCallback();
                });
                return null;
            });
        },
        count : function(data, callback) {
            bridge.connect(function(err, connection){
                data.action = 'count';
                connection.write(data, function(err, data) {
                    callback(err, data);
                });
            })
        },
        destroy : function(callback) {
            bridge.close(callback);
        }
    }
};

var clientId = 0;
function ClientSubscriber(queueName, connection) {
    this.queueName = queueName;
    this.id = ++clientId;
    this.connection = connection;
    var _on = this.on;
    var self = this;
    this.on = function(event, callback) {
        if (event === 'data') {
            var data = {
                action : 'subscriberReady'
            };

            self.connection.write(data, function(err) {
                if (err) { return self.emit('error', err); }

                self.connection.read(function(err, data, acceptCallback) {
                    if (err) { return self.emit('error', err); }

                    callback(data, function(err, acceptObj, callback){
                        acceptCallback(err, acceptObj, callback);
                    });
                });
            });
        } else {
            _on.apply(self, arguments);
        }
    };
    connection.once('close', function(){
        self.emit('close');
    });
}

util.inherits(ClientSubscriber, EventEmitter);

ClientSubscriber.prototype.close = function(callback) {
    this.connection.close(callback);
};
