/*var io = require('socket.io').listen(1337);

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});*/

var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
}).listen(1337, function() { });

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            connection.send("got something");
        }
    });

    connection.on('close', function(connection) {
        // close user connection
    });
});