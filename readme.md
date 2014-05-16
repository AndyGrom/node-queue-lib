The javascript message queue implementation
===========================================
Javascript implementation of message queue with various delivery strategy.

Features
--------
1. Round-robin and broadcast message delivery strategy.
2. Various usages:
	* Into same node.js process.
	* Inter process.
	* Inter platform (node.js and browser).

Installation
------------

```bash
npm install node-queue-lib
```

Simple Usages
-------------

```javascript
var Queue = require('node-queue-lib');

var url = 'http://localhost';

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
```

Inter process usages
--------------------

server message queue:

```javascript
var SocketIoBridgeServer = require('node-queue-lib/lib/net/socket-io-bridge-server');
var http = require('http');
var QueueServer = require('node-queue-lib/lib/core/node-queue-server');

// TCP port for incoming connections
var port = 80;

// Create Socket.IO transport bridge
var serverBridge = new SocketIoBridgeServer(port, function() {
	// return http server instance
	return http.createServer();
});

// Create server and start listening
var server = new QueueServer( { serverBridge : serverBridge } );
```

client (same as above):

```javascript
var Queue = require('node-queue-lib');

var url = 'http://localhost';

// create queue instance
var queue = new Queue( url, 'test-queue', 'broadcast' );

// subscribe on 'Queue name' messages
queue.subscribe(function (subscriber) {
	subscriber.on('data', function (data, accept) {
		console.log(data);
		accept(); // accept process message
		queue.close();
	});
});

// publish message
queue.publish('test');
```

Inter platform usages
---------------------
The server code is the same as above.

client:

```html
<!DOCTYPE html>
<html>
<head>
    <title>message queue example</title>

    <script src="queue.client.js"></script>

    <script>
        (function(){
            var url = 'http://localhost';

            // create queue instance
            var queue = new queuelib.Queue( url, 'test-queue', 'broadcast' );

            // subscribe on 'Queue name' messages
            queue.subscribe(function (err, subscriber) {
                subscriber.on('data', function (data, accept) {
                    document.write(data);
                    accept(); // accept process message
                    queue.close();
                });
            });

            // publish message
            queue.publish('test');
        })();
    </script>
</head>
<body>

</body>
</html>
```

License
-------
The MIT License

Copyright (c) 2014 Gromozdov Andrey Alexandrovich.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.