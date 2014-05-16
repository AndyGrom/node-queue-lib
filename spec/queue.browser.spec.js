/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var QueueServer = require('../lib/core/node-queue-server');
var SocketIoBridgeServer = require('../lib/net/socket-io-bridge-server');
var createHttpServer = require('../test-browser/httpServer');
var colors = require('colors');

var path = require('path');
var childProcess = require('child_process');
var phantomjs = require('phantomjs');

describe('browser test through phantomjs', function(){

    var server;
    beforeEach(function(done){
        server = new QueueServer({
            serverBridge: new SocketIoBridgeServer(8888, function(){
                done();
                return createHttpServer();
            })
        });
    });

    afterEach(function(done){
        server.close(done);
    });


    it('must pass all queue tests', function(done){
        var childArgs = [
            path.join(__dirname, '../test-browser/jasmine-runner.js'),
            'http://127.0.0.1:8888'
        ];

        childProcess.execFile(phantomjs.path, childArgs, function(err, stdout) {
            var result;
            result = JSON.parse(stdout);

            // uncomment it if you have problems
            /*
            if (result.failed) {
                console.log(('FAILED test(s): ' + result.failed).red);
                result.messages.forEach(function(message){
                    console.log('  ' + message.description);
                    message.details.forEach(function(detail){
                        console.log(('    ' + detail).red);
                    })
                });
            }
            */

            expect(result.failed).toBe(0);
            done();
        });
    });
});





