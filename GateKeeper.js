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

// this is a list of all servers connected
var serverList = [];

// this is a list of all the info we've received from each server
// we don't send a client info about a server until we've received it and cached it
// TODO: have clients update the server any time a player joins or leaves, or something important happens
// this way, the server always knows whassup without polling
var serverItems = {};

serverSocket = io.listen(HTTPServer);

serverSocket.on('connection', function (socket) {
	
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
		delete serverItems[serverList.indexOf(socket)];
		serverList.splice(serverList.indexOf(socket), 1);
	});
});

// send a message to every server
serverSocket.broadcast = function(str) {
	for(key in serverList) {
		serverList[key].emit("message", str);
	}
}

// broadcast a request for all connected servers to send server info
// this method clears the cache
// as each incoming info comes in, we should maybe send it to any clients that have requested an update recently
// we should keep a list of clients who have refreshed, and for like 30 seconds any new servers get sent to them?
serverSocket.refresh = function() {
	serverItems = {};
	this.broadcast(this.serverInfoRequest());
}

//this convenience method just returns an empty serverinfo request to be sent to a server
serverSocket.serverInfoRequest = function() {
	return JSON.stringify(ServerExchange.new("ServerInfo", null));
}

// this method doesn't clear any caches, it just takes serverItems and turns its values into an array
serverSocket.generateServerList = function() {
	var list = [];
	for(key in serverItems) {
		list.push(serverItems[key]);
	}
	return list;
}

