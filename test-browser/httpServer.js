/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var http = require('http');
var fs = require('fs');
var mime = require('mime');
var path = require('path');

module.exports = function() {
    return http.createServer(function (req, res) {
        if (req.url == '/') {
            req.url = 'SpecRunner-1.3.1.html';
        }

        var fileName = path.join(__dirname, req.url);
        fs.readFile(fileName, function(err, data) {
            var contentType = mime.lookup(req.url);
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.writeHead(200, {'Content-Type': contentType});
            res.end(data.toString());
        });
    });
};


