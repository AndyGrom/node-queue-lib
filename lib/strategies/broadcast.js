/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */
/*global setImmediate*/

module.exports = broadcastStrategy = {
    init : function(queue) {
    },
    run : function (queue, finish) {
        queue.messagesStorage.next(function(data){

            queue.subscribers.forEach(function(subscriber){
                if (!subscriber.queue) {
                    subscriber.queue = [];
                }
                subscriber.queue.push(data);
                if (!subscriber.process) {
                    subscriber.process = process(subscriber);
                }
                setImmediate(subscriber.process);
            });

            finish();
        });
    },
    removeSubscriber : function(subscriber, callback) {
        if (subscriber.queue) {
            while(subscriber.queue.length) {
                subscriber.queue.pop();
            }
        }
        callback && callback();
    }
};

function process(subscriber) {
    return function () {
        if (!subscriber.processing) {
            (function next() {
                var data = subscriber.queue && subscriber.queue.shift();
                if (data) {
                    subscriber.processing = true;
                    subscriber.subscriber.emit('data', data, function(err, acceptObject, acceptCallback){
                        subscriber.processing = false;
                        acceptCallback && acceptCallback();
                        next();
                    });
                } else {
                    delete subscriber.queue;
                    subscriber.processing = false;
                }
            })();
        }
    };
}