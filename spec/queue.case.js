/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var utils = require('../lib/core/utils');

module.exports = function(createContext) {

    describe('test broadcast strategy', function () {
        var strategy = 'broadcast';

        it('1 subscriber, 1 publish', function (done) {
            createContext(strategy, function(queue) {
                var data = 1;

                queue.subscribe(function (err, subscriber) {
                    subscriber.on('data', function (obj, accept) {
                        expect(obj).toBe(data);
                        accept && accept(null, true, function(){
                            queue.count(function (err, length) {
                                expect(length).toBe(0);
                                done();
                            });
                        });
                    });
                });
                queue.publish(data);
            });
        });

        it('1 subscriber, n publish', function (done) {
            createContext(strategy, function(queue) {

                var data = [1, 2, 3];

                var subscribers;
                var queueSubscriber;

                var received = [];
                var funcCalled = utils.after(data.length, function () {
                    data.forEach(function(item){
                        expect(received.indexOf(item)).toBeGreaterThan(-1);
                    });
                    done();
                });

                subscribers = {
                    subscriber: function (obj, accept) {
                        accept && accept();
                        received.push(obj);
                        funcCalled();
                    }
                };

                spyOn(subscribers, 'subscriber').andCallThrough();

                queue.subscribe(function (err, subscriber) {
                    queueSubscriber = subscriber;
                    subscriber.on('data', subscribers.subscriber);
                });

                data.forEach(function (item) {
                    queue.publish(item);
                });
            });
        });

        it('multiple subscribers with multiple publish', function (done) {
            createContext(strategy, function(queue) {

                var allSubscribersCalled = utils.after(2, function () {
                    done();
                });

                var subscriber1Called = utils.after(2, function () {
                    allSubscribersCalled();
                });

                var subscriber2Called = utils.after(2, function () {
                    allSubscribersCalled();
                });

                var onSubscribe = utils.after(2, function () {
                    queue.publish(1);
                    queue.publish(2);
                });

                queue.subscribe(function (err, subscriber) {
                    subscriber.on('data', function (data, acceptCallback) {
                        subscriber1Called();
                        acceptCallback(true);
                    });
                    onSubscribe();
                });

                queue.subscribe(function (err, subscriber) {
                    subscriber.on('data', function (data, acceptCallback) {
                        subscriber2Called();
                        acceptCallback(true);
                    });
                    onSubscribe();
                });
            });
        });

        it('must correct unsubscribe', function (done) {
            createContext(strategy, function(queue) {

                var subscriber1, subscriber2;
                var publishCount = 2;
                var called = utils.after(publishCount + 1, function () {
                    expect(subscribers.subscriber1.calls.length).toBe(1);
                    expect(subscribers.subscriber2.calls.length).toBe(publishCount);

                    done();
                });

                var subscribers = {
                    subscriber1: function () {
                        subscriber1.close(function(){
                            called();
                        });
                    },
                    subscriber2: function (data, accept) {
                        accept(null, true, function () {
                            called();
                        });
                    }
                };

                spyOn(subscribers, "subscriber1").andCallThrough();
                spyOn(subscribers, "subscriber2").andCallThrough();

                queue.subscribe(function (err, subscriber) {
                    subscriber1 = subscriber;
                    subscriber.on('data', subscribers.subscriber1);

                    queue.subscribe(function (err, subscriber) {
                        subscriber2 = subscriber;
                        subscriber.on('data', subscribers.subscriber2);

                        for (var i = 0; i < publishCount; i++) {
                            queue.publish(1);
                        }
                    });
                });
            });

        });

        it('subscriber must receive data after connect', function (done) {
            createContext(strategy, function(queue) {

                var data = 1;
                queue.publish(data, function () {
                    queue.subscribe(function (err, subscriber) {
                        subscriber.on('data', function (response) {
                            expect(response).toBe(data);
                            done();
                        });
                    });
                });
            });
        });
    });

    describe('test round-robin strategy', function () {
        var strategy = 'roundRobin';

        it('1 publish 1 subscriber', function (done) {
            createContext(strategy, function(queue) {

                queue.subscribe(function (err, subscriber) {
                    subscriber.on('data', function (data, accept) {
                        expect(data).toBe(1);
                        accept && accept(null, true, function(){
                            queue.count(function (err, length) {
                                expect(length).toBe(0);
                                done();
                            });
                        });
                    });
                });

                queue.publish(1);
            });
        });

        it('3 publish 1 subscriber', function (done) {
            createContext(strategy, function(queue) {

                var onData = utils.after(3, function(){
                    done();
                });

                queue.subscribe(function (err, subscriber) {
                    subscriber.on('data', function(data, accept){
                        accept();
                        onData();
                    });
                });

                queue.publish(1);
                queue.publish(1);
                queue.publish(1);
            });
        });

        it('must return data into queue than not accepted of subscriber', function (done) {
            createContext(strategy, function(queue) {

                var called = utils.after(4, function () {
                    expect(subscribers.subscriber1.calls.length).toBe(2);
                    expect(subscribers.subscriber2.calls.length).toBe(1);
                    expect(subscribers.subscriber3.calls.length).toBe(1);

                    done();
                });

                var subscribers = {
                    subscriber1: function (data, accept) {
                        accept && accept();
                        called();
                    },
                    subscriber2: function (data, accept) {
                        accept(null, false);
                        called();
                    },
                    subscriber3: function (data, accept) {
                        accept && accept();
                        called();
                    }
                };

                spyOn(subscribers, "subscriber1").andCallThrough();
                spyOn(subscribers, "subscriber2").andCallThrough();
                spyOn(subscribers, "subscriber3").andCallThrough();

                queue.subscribe(function (err, subscriber) {
                    subscriber.on('data', subscribers.subscriber1);

                    queue.subscribe(function (err, subscriber) {
                        subscriber.on('data', subscribers.subscriber2);

                        queue.subscribe(function (err, subscriber) {
                            subscriber.on('data', subscribers.subscriber3);

                            queue.publish(1);
                            queue.publish(2);
                            queue.publish(3);

                        });
                    });
                });
            });
        });

        it('must correct unsubscribe', function (done) {
            createContext(strategy, function(queue) {

                var subscriber1, subscriber2;
                var called = utils.after(3, function () {
                    expect(subscribers.subscriber1.calls.length).toBe(1);
                    expect(subscribers.subscriber2.calls.length).toBe(2);

                    done();
                });

                var subscribers = {
                    subscriber1: function (data, accept) {
                        accept && accept();
                        called();
                        subscriber1.close();
                    },
                    subscriber2: function (data, accept) {
                        accept && accept();
                        called();
                    }
                };

                spyOn(subscribers, "subscriber1").andCallThrough();
                spyOn(subscribers, "subscriber2").andCallThrough();

                queue.subscribe(function (err, subscriber) {
                    subscriber1 = subscriber;
                    subscriber.on('data', subscribers.subscriber1);
                });
                queue.subscribe(function (err, subscriber) {
                    subscriber2 = subscriber;
                    subscriber.on('data', subscribers.subscriber2);
                });

                queue.publish(1);
                queue.publish(1);
                queue.publish(1);
            });
        });

        it('subscriber must receive data after connect', function (done) {
            createContext(strategy, function(queue) {

                var data = 1;
                queue.publish(data, function () {
                    queue.subscribe(function (err, subscriber) {
                        subscriber.on('data', function (response) {
                            expect(response).toBe(data);
                            done();
                        });
                    });
                });
            });
        });
    });
};