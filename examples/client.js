/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var Queue = require('node-queue-lib');

var url = 'http://localhost:8888';

// create queue instance
var queue = new Queue( url, 'test-queue', 'broadcast' );

// subscribe on 'Queue name' messages
queue.subscribe(function (err, subscriber) {
    subscriber.on('data', function (data, accept) {
        console.log(data);
        accept(); // accept process message
        queue.close();
    });
});

// publish message
queue.publish('test');