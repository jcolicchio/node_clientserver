// TODO: oauth and account registration stuff
// TODO: some kind of protocol design for verifying client A connecting to server B is a legit client A
// presumably GateKeeper will assign client A an auth token
// client A needs to send it to server B, so that server B can double-check client A's identity

// we need ws for client-to-server communication
var ws = require('ws');
// we need io for server-to-server communication
var io = require('socket.io');

var AES = require('./html/server/AES.js');

var Protocol = require('./html/server/Protocol.js');
var ServerInfo = require('./html/server/ServerInfo.js');

// the settings are private, the info is public
var GateKeeperSettings = require('./GateKeeperSettings.js');

// the info is public, contains stuff like which ports to use, etc
var GateKeeperInfo = require('./html/server/GateKeeperInfo.js');



var HTTPServer = require('./HTTPServer.js').init(GateKeeperInfo.webPort);

// **** CLIENT COMMUNICATION ****

//server items should be used like this
//every time the client wants to refresh, should we blast the servers with a request?
//another thing we could do is forward the "requesting" client with asynchronous info responses as they arrive?
//this would look the same as when you hit refresh in tf2 and the server list populates iteratively

// set up the socket that listens for clients
var clientSocket = ws.createServer({port:GateKeeperInfo.clientPort}, function (connection) {
	// a new client has joined
	clientSocket.clients.push(connection);

	//send the new client the list of game servers
	var list = serverSocket.generateServerList();
	connection.send(JSON.stringify(Protocol.new("ServerList", list)));
	
	connection.onmessage = function(event) {
		// TODO: try catch! user might try to break the server
		
		var protocol = Protocol.import(event.data);

		if(protocol.key == "ServerList") {
			// the player is asking for a server list!
			// serialize serverItem list, maybe refresh it once? maybe refresh every 30 seconds or so?
			var list = serverSocket.generateServerList();
			connection.send(JSON.stringify(Protocol.new("ServerList", list)));
		} else {
			console.log("unknown message type: "+protocol.key+" sent to gatekeeper from client, with payload: "+JSON.stringify(protocol.payload));
		}
	};

	connection.onclose = function() {
		// client left the server itself
		clientSocket.clients.splice(clientSocket.clients.indexOf(connection), 1);
	};
});

clientSocket.broadcast = function(str) {
	for(key in clientSocket.clients) {
		clientSocket.clients[key].send(str);
	}
}

clientSocket.clients = [];


// **** SERVER COMMUNICATION ****
// set up the socket that listens for servers

// TODO: probably. maybe we need to drop unresponsive servers?
// when we heartbeat, if some servers don't respond, do we drop em?

// this is a list of all servers connected
var serverList = [];

serverSocket = io.listen(HTTPServer);

serverSocket.servers = [];

serverSocket.on('connection', function (socket) {
	// TODO: try catch! user might try to break the server

	// a new server has joined

	// TODO: check whitelist or blacklist if either is real
	// make sure if whitelist isn't null, it's on the list
	// make sure if blacklist isn't null, it's NOT on the list
	// if the server is blacklisted or we're whitelisting

	// If we've taken some other kind of security measure to ensure only valid servers are connecting
	// Then we need to do that here too
	// Presumably we'll put some kind of key in GateKeeperSettings.js and not push it to github in our
	// "official" implementation
	// Or, we'll just whitelist local servers

	serverSocket.servers.push(socket);

	//outright ask for their info!
	socket.emit("message", serverSocket.serverInfoRequest());

	
	socket.on("message", function (data) {

		var protocol = Protocol.import(data);
		
		if(protocol.key == "ServerInfo") {

			protocol.payload.ip = socket.conn.remoteAddress;

			// We can't use socket as key, it's too complex
			//instead, we can search for the entry in serverSocket.servers, and use the index as a key

			socket.serverItem = protocol.payload;

		} else {
			console.log("unknown message type: "+protocol.key+" sent to gatekeeper from server, with payload: "+JSON.stringify(protocol.payload));
		}
	});

	socket.on('disconnect', function() {
		// a server went down
		serverSocket.servers.splice(serverSocket.servers.indexOf(socket), 1);
	});
});

// send a message to every server
serverSocket.broadcast = function(str) {
	for(key in serverSocket.servers) {
		serverSocket.servers[key].emit("message", str);
	}
}

// broadcast a request for all connected servers to send server info
// this method clears the cache
// as each incoming info comes in, we should maybe send it to any clients that have requested an update recently
// we should keep a list of clients who have refreshed, and for like 30 seconds any new servers get sent to them?
serverSocket.refresh = function() {
	// somehow clear the thinger?
	this.broadcast(this.serverInfoRequest());
}

//this convenience method just returns an empty serverinfo request to be sent to a server
serverSocket.serverInfoRequest = function() {
	return JSON.stringify(Protocol.new("ServerInfo", null));
}

// this method doesn't clear any caches, it just takes serverItems and turns its values into an array
serverSocket.generateServerList = function() {
	var list = [];
	for(key in serverSocket.servers) {
		list.push(serverSocket.servers[key].serverItem);
	}
	return list;
}

