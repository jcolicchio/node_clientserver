// we need ws for client-to-server communication
var ws = require('ws');
// we need io for server-to-server communication
var io = require('socket.io');

var ServerExchange = require('./html/server/ServerExchange.js');
var ServerInfo = require('./html/server/ServerInfo.js');

// the settings are private, the info is public
var GateKeeperSettings = require('./GateKeeperSettings.js');

var GateKeeperInfo = require('./html/server/GateKeeperInfo.js');

var HTTPServer = require('./HTTPServer.js').init(GateKeeperInfo.webPort);

// TODO: probably. maybe we need to drop unresponsive servers?

// TODO: move these into properties of the clientSocket and serverSocket items
var clientList = [];

//server items should be used like this
//every time the client wants to refresh, should we blast the servers with a request?
//another thing we could do is forward the "requesting" client with asynchronous info responses as they arrive?
//this would look the same as when you hit refresh in tf2 and the server list populates iteratively

// set up the socket that listens for clients
var clientSocket = ws.createServer({port:GateKeeperInfo.clientPort}, function (connection) {
	// a new client has joined
	clientList.push(connection);
	console.log("new client joined!");

	//send the new client the list of game servers
	var list = serverSocket.generateServerList();
	connection.send(JSON.stringify(ServerExchange.new("ServerList", list)));
	
	connection.onmessage = function(event) {
		var exc = ServerExchange.import(event.data);

		if(exc.key == "ServerList") {
			// the player is asking for a server list!
			// serialize serverItems, maybe refresh it once? maybe refresh every 30 seconds or so?
			var list = serverSocket.generateServerList();
			connection.send(JSON.stringify(ServerExchange.new("ServerList", list)));
		} else {
			console.log("unknown message type: "+exc.key+" sent to gatekeeper from client, with payload: "+JSON.stringify(exc.payload));
		}
	};

	connection.onclose = function() {
		// client left the server itself
		clientList.splice(clientList.indexOf(connection), 1);
	};
});

clientSocket.broadcast = function(str) {
	for(key in clientList) {
		clientList[key].send(str);
	}
}

// set up the socket that listens for servers

var serverList = [];

var serverItems = {};

serverSocket = io.listen(HTTPServer);

serverSocket.on('connection', function (socket) {
	
	console.log("new server wants to join!");
	// a new server has joined
	serverList.push(socket);

	//outright ask for their info!
	socket.emit("message", serverSocket.serverInfoRequest());

	
	socket.on("message", function (data) {

		var exc = ServerExchange.import(data);
		
		if(exc.key == "ServerInfo") {

			exc.payload.ip = socket.conn.remoteAddress;

			// We can't use socket as key, it's too complex
			//instead, we can search for the entry in serverList, and use the index as a key

			serverItems[serverList.indexOf(socket)] = exc.payload;

		} else {
			console.log("unknown message type: "+exc.key+" sent to gatekeeper from server, with payload: "+JSON.stringify(exc.payload));
		}
	});

	socket.on('disconnect', function() {
		// a server went down
		serverList.splice(serverList.indexOf(socket), 1);
		delete serverItems[serverList.indexOf(socket)];
	});
});

serverSocket.broadcast = function(str) {
	for(key in serverList) {
		serverList[key].emit("message", str);
	}
}

// broadcast a request for all connected servers to send server info
serverSocket.refresh = function() {
	serverItems = {};
	this.broadcast(this.serverInfoRequest());
}

serverSocket.serverInfoRequest = function() {
	return JSON.stringify(ServerExchange.new("ServerInfo", null));
}

serverSocket.generateServerList = function() {
	var list = [];
	for(key in serverItems) {
		list.push(serverItems[key]);
	}
	return list;
}

