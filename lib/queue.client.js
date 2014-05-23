/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var QueueClient = require('./core/node-queue-client');
var Bridge = require('./net/socket-io-bridge-client');
function Queue(url, queueName, strategy) {

    var client = new QueueClient({
        queueName: queueName,
        strategy: strategy,
        clientBridge: new Bridge(url)
    });

    return {
        publish : function(data, callback) {
            client.publish(data, callback);
        },
        subscribe : function(callback) {
            client.subscribe(callback);
        },
        count : function(callback) {
            client.count(callback);
        },
        close: function(callback) {
            client.close(callback);
        }
    };
}

module.exports = Queue;

/* istanbul ignore next */
if (typeof window === 'object') {
    window.queuelib = {
        Queue : Queue
    };
}