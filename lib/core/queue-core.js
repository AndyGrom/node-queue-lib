/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */


/*global require, process, module */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var QueueStorage = require('./memory-storage');

var strategies = require('./strategy');

var queue = {};

function Queue(name, strategy, messagesStorage) {

    if (!queue[name]) {

        var deliveryStrategy = strategies.get(strategy);
        if (!deliveryStrategy) {
            return createErrorObject(strategy);
        }

        var queueProperties = {
            name : name,
            processing : false,
            strategy : deliveryStrategy,
            messagesStorage: messagesStorage || new QueueStorage(name),
            subscribers: new Subscribers()
        };

        queue[name] = queueProperties;
        queueProperties.strategy.init && queueProperties.strategy.init(queueProperties);
    }

    return {
        publish : function(data, callback) {
            process.nextTick(function(){
                internalPublish(name, data, callback);
            });
        },
        subscribe : function(callback) {
            internalSubscribe(name, callback);
        },
        count : function(callback) {
            queue[name].messagesStorage.count(function(err, data){
                callback(err, data);
            });
        },
        close : function(callback) {
            var queues = Object.getOwnPropertyNames(queue);
            (function nextQueue(queueName) {
                if (queueName) {
                    (function next(subscriber) {
                        if (subscriber) {
                            if (queue[queueName].strategy.removeSubscriber) {
                                queue[queueName].strategy.removeSubscriber(subscriber, function() {
                                    next(queue[queueName].subscribers.pop());
                                });
                            } else {
                                next(queue[queueName].subscribers.pop());
                            }
                        } else {
                            nextQueue(queues.pop());
                        }
                    })(queue[queueName].subscribers.pop());
                } else {
                    queue = {};
                    callback();
                }
            })(queues.pop());
        },
        registerStrategy : strategies.register
    }
}

function internalPublish(name, data, callback) {
    queue[name].messagesStorage.push(data, function(){
        if (!queue[name].processing) {
            processQueue(name);
        }
        return callback && callback();
    });
}

var subscriberId = 0;
function internalSubscribe(name, callback) {
    var subscriber = new Subscriber(queue[name]);

    queue[name].subscribers.push({
        subscriber : subscriber,
        id : subscriber.id
    });
    callback(null, subscriber);
}

function processQueue(name) {
    var q = queue[name];

    q.messagesStorage.count(function(err, length) {
       if (length && q.subscribers.length > 0) {
           q.processing = true;
           q.strategy.run.call(this, q, function() {
               q.processing = false;
               process.nextTick(function() {
                   processQueue(name);
               });
           });
       }
    });
}

function Subscribers() {
    var result = [];
    result.remove = function(id) {
        for(var i = 0; i < this.length; i++) {
            if (this[i].id === id) {
                this.splice(i, 1);
                return true;
            }
        }
    };

    result.find = function(id) {
        for(var i = 0; i < this.length; i++) {
            if (this[i].id === id) {
                return this[i];
            }
        }
    }

    return result;
}

function Subscriber(queue) {
    this.queue = queue;
    this.id = ++subscriberId;

    var self = this;
    var _on = this.on;
    this.on = function() {
        var args = Array.prototype.slice.call(arguments);
        _on.apply(self, args);
        if (!self.queue.processing) {
            processQueue(self.queue.name);
        }
    }
}

util.inherits(Subscriber, EventEmitter);

Subscriber.prototype.close = function(callback) {
    if (this.queue.strategy.removeSubscriber) {
        var subscriber = this.queue.subscribers.find(this.id);
        this.queue.strategy.removeSubscriber(subscriber, callback);
    }
    if (this.queue.subscribers.remove(this.id) ) {
        this.emit('close');
    }
};

function createErrorObject(strategy) {
    var err = 'unknown strategy "' + strategy + '"';
    return {
        publish : function(data, callback) {
            callback(err);
        },
        subscribe : function(callback) {
            callback(err);
        },
        count : function(callback) {
            callback(err);
        }
    }
}


strategies.register('broadcast', require('./../strategies/broadcast'));
strategies.register('roundRobin', require('./../strategies/round-robin'));

module.exports = Queue;