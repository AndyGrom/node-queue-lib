var Queue = require('node-queue-lib/queue.core');

var queue = new Queue('Queue name', 'broadcast');

// subscribe on 'Queue name' messages
queue.subscribe(function (err, subscriber) {
    subscriber.on('data', function (data, accept) {
        console.log(data);
        accept(); // accept process message
    });
});

// publish message
queue.publish('test');