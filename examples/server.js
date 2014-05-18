/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var SocketIoBridgeServer = require('node-queue-lib/lib/net/socket-io-bridge-server');
var http = require('http');
var QueueServer = require('node-queue-lib/lib/core/node-queue-server');

// TCP port for incoming connections
var port = 8888;

// Create Socket.IO transport bridge
var serverBridge = new SocketIoBridgeServer(port, function() {
    // return http server instance
    return http.createServer(handler);
});

// Create server and start listening
var server = new QueueServer( { serverBridge : serverBridge } );

var fs = require('fs');
var path = require('path');

function handler(req, res) {

    var response = {
        code : 404,
        data : '',
        contentType : 'text/plain'
    };
    console.log(req.url);

    switch(req.url) {
        case '/' :
            fs.readFile(path.join(__dirname, 'client.html'), function(err, data) {
                response = {
                    code : 200,
                    data : data.toString(),
                    contentType : 'text/html'
                };
                sendResponse(res, response);
            });
            break;
        case '/queue.client.js' :
            var name = path.join(__dirname, '../lib/client/queue.client.min.js');
            fs.readFile(name, function(err, data) {
                response = {
                    code : 200,
                    data : data.toString(),
                    contentType : 'application/javascript'
                };
                sendResponse(res, response);
            });
            break;
        default:
            sendResponse(res, response);
    }
}

function sendResponse(res, response) {
    res.writeHead(response.code, {'Content-Type' : response.contentType});
    res.end(response.data);
}