/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var Queue = require('../lib/queue.client.js');
var testCase = require('../spec/queue.case.js');

var queue;

afterEach(function (done) {
    queue.client.close(done);
});

var queueNum = 1000;
var url = "http://localhost:8888";

testCase(function(strategy, callback){
    var name = 'queue' + queueNum++;
    queue = { client : new Queue(url, name, strategy) };
    callback(queue);
});

