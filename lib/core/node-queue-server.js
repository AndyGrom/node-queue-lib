/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var ServerChannel = require('./../net/server-channel');
var memoryStorageFactory = require('./memory-storage');
var Queue = require('./queue-core');

function QueueServer(settings) {

    if (settings.Queue) {
        Queue = settings.Queue;
    }

    var server = new ServerChannel(settings.serverBridge);

    function createMessageStorage(name) {
        var factory = settings.messagesStorage || memoryStorageFactory;
        return factory(name);
    }

    server.listen();
    server.on('subscribe', function(obj, channel, channelAcceptCallback) {
        var queueSubscriber;

        channel.once('close', function() {
            queueSubscriber && queueSubscriber.removeAllListeners && queueSubscriber.removeAllListeners();
            queueSubscriber && queueSubscriber.close();
        });
        channelAcceptCallback();
        channel.once('subscriberReady', function(subscriberReadyAccept) {

            var queue = new Queue(obj.queueName, obj.strategy, createMessageStorage(obj.queueName));
            queue.subscribe(function(err, subscriber) {
                queueSubscriber = subscriber;
                subscriberReadyAccept(err);
                if (!err) {
                    subscriber.on('data', function(data, queueAcceptCallback) {
                        channel.write(data, function(err, writeAcceptObject, writeAcceptCallback) {
                            queueAcceptCallback(err, writeAcceptObject, function() {
                                writeAcceptCallback && writeAcceptCallback();
                            });
                        });
                    });
                }
            });
        });
    });

    server.on('publish', function(obj, accept) {
        var queue = new Queue(obj.queueName, obj.strategy, createMessageStorage(obj.queueName));
        queue.publish(obj.data, function(err) {
            accept(err);
        });
    });

    server.on('count', function(obj, callback) {
        var queue = new Queue(obj.queueName, obj.strategy, createMessageStorage(obj.queueName));
        queue.count(function(err, data){
            callback(err, data);
        });
    });

    return {
        close : function(callback) {
            server.destroy(callback);
        }
    }
}

module.exports = QueueServer;