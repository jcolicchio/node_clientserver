var ws = require('ws');
// we need io for server-to-server communication
var io = require('socket.io');

var ServerExchange = require('./html/server/ServerExchange.js');


var ServerInfo = require('./html/server/ServerInfo.js');

// the settings are private, the info is public
var GateKeeperSettings = require('./GateKeeperSettings.js');

var GateKeeperInfo = require('./html/server/GateKeeperInfo.js');
// when i import this, will it register with MY copy of ServerExchange? I don't think it will

var HTTPServer = require('./HTTPServer.js').init(GateKeeperInfo.webPort);


// TODO: move these into properties of the portals
var clientList = [];

var serverList = [];

var serverItems = {};
//var cachedServerItemsList = [];

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


//var serverSocket = ws.createServer({port:GateKeeperInfo.serverPort}, function(connection) {
serverSocket = io.listen(HTTPServer);

serverSocket.on('connection', function (socket) {
	
	console.log("new server wants to join!");
	// a new server has joined
	serverList.push(socket);

	//outright ask for their info!
	socket.emit("message", serverSocket.serverInfoRequest());

	
	socket.on("message", function (data) {

		console.log("new message!");
		var exc = ServerExchange.import(data);
		console.log("a");
		
		if(exc.key == "ServerInfo") {
			//exc.payload.ip = connection.
			exc.payload.ip = socket.conn.remoteAddress;
			//for(key in serverList) {
			//	if(key == socket) {
			//		console.log("theyre equal!");
			//	}
			//}
			// We can't use socket as key, it's too complex
			var key = serverList.indexOf(socket);
			serverItems[key] = exc.payload;
			console.log(JSON.stringify(serverItems));

		}
	});

	socket.on('disconnect', function() {
		// a server went down
		serverList.splice(serverList.indexOf(socket), 1);
		delete serverItems[serverList.indexOf(socket)];
	});
});

//serverSocket.listen(GateKeeperInfo.serverPort);
//console.log("server socket listening on "+GateKeeperInfo.serverPort)


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

