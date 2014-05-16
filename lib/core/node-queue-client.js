/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var ClientChannel = require('./../net/client-channel');

function QueueClient(settings) {

    var self = {};

    self.queueName = settings.queueName;
    self.strategy = settings.strategy;

    var client = new ClientChannel(settings.clientBridge);

    return {
        publish : function(data, callback) {
            var request = {
                queueName: self.queueName,
                strategy : self.strategy,
                data: data
            };

            client.publish(request, callback)
        },
        subscribe : function(callback) {
            var request = {
                queueName: self.queueName,
                strategy : self.strategy
            };

            var clientSubscriber;
            client.subscribe(request, function(err, subscriber) {
                clientSubscriber = subscriber;
                callback(err, subscriber);
            });
        },
        count : function(callback) {
            var request = {
                queueName: self.queueName,
                strategy : self.strategy
            };

            client.count(request, callback);
        },
        close : function(callback) {
            client.destroy(callback);
        }
    }
}

module.exports = QueueClient;