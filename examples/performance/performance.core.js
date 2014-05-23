/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var Queue = require('../../queue.core');
var test = require('./test');
var Profile = require('./profile');

var queue = new Queue('Queue name', 'broadcast');

// subscribe on 'Queue name' messages
queue.subscribe(function (err, subscriber) {
    subscriber.on('data', function (data, accept) {
        accept(); // accept process message
    });
});

function testFn(done) {
    test(queue, 100000, function () {
        done();
    });
}
var profile = new Profile();
profile.run(testFn, function(){
    profile.print();
});
