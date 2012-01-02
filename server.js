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

Client.broadcast_list = function(channel) {
  var all = [];
  ps.each(channel, function(val){
    all.push(val.u_id && (val.u_id.name || val.u_id.id));
  });
  ps.pub(channel, ["list", {name: "Composure"}, all]);
};

Client.prototype = {
  send: function(evt, sender, msg) {
    var name = sender.name || sender.id, message = {evt: evt, from: name, says: msg, channel: this.current_channel};
    this.conn.send(JSON.stringify(message));
  },
	init_connection: function() {
    var me = this;
    ps.sub("global",function() { 
      me.send.apply(me, arguments);
    }, me);

    me.conn.on("message", function(message) {
      if(message.type === "utf8") {
        me.use(me.parse(message.utf8Data));
      }
    });

    me.conn.on('close', function(connection) {
      ps.clear("global", me);     
      ps.clear(me.current_channel, me);     
      console.log("Closed - " + me.id);
    });
	},
  parse: function(msg) {
    var process_msg;
    try {
      process_msg = JSON.parse(msg);
    } catch(e) {
      console.log("Parser error! - " + msg + process_msg);
    }

    return process_msg;
  },
  use: function(message) {
    if(!message) {return;}
    var command = message.command,
      channel = message.channel,
      statement = message.statement,
      me = this;

    switch(command) {
      case "say":
        if(!channel) {break;}
        ps.pub(channel, ["said" , me, statement]);

        break;
      case "name":
        me.name = statement;
        me.send("named", me, statement);
        Client.broadcast_list(me.current_channel);

        break;
      case "channel":
        ps.pub(me.current_channel, ["left", me, "left channel "+me.current_channel]);
        ps.clear(me.current_channel, me);
        Client.broadcast_list(me.current_channel);

        ps.sub(statement, function() {
          me.send.apply(me, arguments);
        }, me);

        if(!statement) {break;}
        me.current_channel = statement;
        ps.pub(statement, ["joined", me, "joined channel "+statement]);
        Client.broadcast_list(me.current_channel);

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
