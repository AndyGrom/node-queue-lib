/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */


var Queue = require('node-queue-lib');
var util = require('util');

var url = 'http://localhost:8888';

// create queue instance
var queue = new Queue( url, 'test-queue', 'broadcast' );

// subscribe on 'Queue name' messages
queue.subscribe(function (err, subscriber) {
    subscriber.on('data', function (data, accept) {
        accept(); // accept process message
    });
});



var stat = {
    total : 0,
    throughput : 0,
    memory: 0
};

var start = new Date().getTime();
(function next() {
    stat.total++;
    queue.publish('test', function() {
        next();
    });
    if (stat.total % 1000 === 0) {
        var end  = new Date().getTime();
        var seconds = (end - start) / 1000;

        stat.throughput = (stat.total / seconds).toFixed(0);

        var memUsage = process.memoryUsage();

        stat.memory = 'use: ' + memUsage.heapUsed + '/ tot: ' + memUsage.heapTotal + '/ rss :' + memUsage.rss;
        var message = util.format("Total: %d. Throughput: %d (msg/sec). Memory: %s", stat.total, stat.throughput, stat.memory);
        process.stdout.write(message + '\r');
    }
})();

