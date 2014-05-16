/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

module.exports = roundRobinStrategy = {
    init : function(queue) {
        queue.subscribers = new Ring();
    },
    run : function (queue, finish) {
        (function next(){
            queue.messagesStorage.next(function(data){
                if (data) {
                    var subscriber = queue.subscribers.next();
                    subscriber.subscriber.emit('data', data, function(err, accept, acceptCallback){
                        var accepted = typeof(accept) === "undefined" || accept === null ? true : accept;
                        if (!accepted) {
                            queue.messagesStorage.unshift(data, function() {
                                acceptCallback && acceptCallback();
                                return next();
                            });
                        } else {
                            acceptCallback && acceptCallback();
                            next();
                        }
                    });
                } else {
                    finish();
                }
            });
        })();
    }
};

function Ring() {
    var arr = [];
    var current = -1;
    arr.next = function(){
        current++;
        if (current >= arr.length) {
            current = 0;
        }

        return arr[current];
    };

    arr.remove = function(id) {
        for(var i = 0; i < this.length; i++) {
            if (this[i].id === id) {
                this.splice(i, 1);
                if (current > i && current != 0) {
                    current--;
                }
                break;
            }
        }
    };

    return arr;
}
