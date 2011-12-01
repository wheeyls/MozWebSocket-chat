var WebSocketServer = require('websocket').server;
var http = require('http');
var ps = require("./pubsub.js").pubsub();


var Client = function(conn) {
	this.conn = conn;
  this.id = new Date().getTime();
  this.current_channel = "";
	this.name = "";
  this.init_connection();
}

Client.prototype = {
  send: function(evt, sender, msg) {
    var name = sender.name || sender.id, message = {evt: evt, from: name, says: msg, channel: this.current_channel};
    this.conn.send(JSON.stringify(message));
  },
	init_connection: function() {
    var me = this;
    ps.sub("global",function() { 
      me.send.apply(me, arguments);
    }, me.id);

    me.conn.on("message", function(message) {
      if(message.type === "utf8") {
        me.use(me.parse(message.utf8Data));
      }
    });

    me.conn.on('close', function(connection) {
      ps.clear("global", me.id);     
      ps.clear(me.current_channel, me.id);     
      console.log("Closed - " + me.id);
    });
	},
  parse: function(msg) {
    // message will be in the format: command [channel:name] message
    // example: say channel:global hi!
    // example: name New Name
    // example: channel new_channel
    var process_msg = msg.match(/^\s*(\w+)\s+(channel:([\w]+))*\s*(.*)$/),
      command,
      channel,
      statement;

    if(process_msg) {
      command = process_msg[1];
      channel = process_msg[3];
      statement = process_msg[4];
    }
      
    if(!command) {console.log("Parser error! - " + msg + process_msg);}
    return {command: command, channel: channel, statement: statement};
  },
  use: function(message) {
    var command = message.command,
      channel = message.channel || "global",
      statement = message.statement,
      me = this;

    switch(command) {
      case "say":
        ps.pub(channel, ["said" , me, statement]);

        break;
      case "name":
        me.name = statement;
        me.send("named", me, statement);

        break;
      case "channel":
        ps.pub(me.current_channel, ["left", me, "left channel "+me.current_channel]);
        ps.clear(me.current_channel, me.id);

        ps.sub(statement, function() {
          me.send.apply(me, arguments);
        }, me.id);

        me.current_channel = statement;
        ps.pub(statement, ["joined", me, "joined channel "+statement]);

        break;
    }
  }
};



var server = http.createServer(function(request, response) {
}).listen(8124);

console.log("Server up on 8124");

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
  console.log("connection received");
  var connection = request.accept(null, request.origin);
  new Client(connection);
});
