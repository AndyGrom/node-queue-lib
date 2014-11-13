/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var http = require('http');
var SocketIoBridgeServer = require('../lib/net/socket-io-bridge-server');

var QueueServer = require('../lib/core/node-queue-server');
var Queue = require('../lib/queue.client.js');

describe('tests for fault tolerance', function(){

    it('wrong strategy name must return error for publisher', function(done) {
        createContext(done, function(client, done){
            client.publish(1, function(err) {
                expect(err).toBeDefined();
                done();
            });
        });
    });

    it('wrong strategy name must return error for subscriber', function(done) {
        createContext(done, function(client, done){
            client.subscribe(function(err, subscriber) {
                subscriber.on('error', function(err){
                    expect(err).toBeDefined();
                    done();
                });
                subscriber.on('data');
            });
        });
    });

    it('wrong strategy name must return error for count method', function(done) {
        createContext(done, function(client, done){
            client.count(function(err) {
                expect(err).toBeDefined();
                done();
            });
        });
    });

});

function createContext(done, callback) {
    var port = 8887;
    var serverBridge = new SocketIoBridgeServer(port, function() {
        return http.createServer();
    });

    var server = new QueueServer( { serverBridge : serverBridge } );

    var url = 'http://localhost:' + port;
    var client = new Queue( url, 'test-queue', 'buggy-strategy' );
    callback(client, function(){
        client.close(function(){
            server.close(function(){
                done();
            });
        });
    });
}