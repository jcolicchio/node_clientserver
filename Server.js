// This module encapsulates all the base functionality of a server
// It interacts with gatekeeper
// It can check user-submitted passwords
// It can authenticate with GK

// When you use it, define methods as you need:
// onConnect(connection) // whenever a client connects and is authenticated
	// both with GK and by supplying a server password, if needed
// onDisconnect(connection) // whenever a client disconnects
// onMessage(connection, key, payload)
// onError(connection, error) // not implemented
// getInfo() -- implement if you do custom ServerInfo, return a ServerInfo object

// Keeping scalability in mind, theoretically any user should be able to spin one of these up
// However, if we want GateKeeper to only talk to legit servers that we control, we could
// Put some kind of whitelist of server IPs, such that GateKeeper won't list an unauthorized server unless its IP matches
// And furthermore, we could have some kind of config in some private GateKeeper setting


// we need ws for talking to clients
var ws = require('ws');
// we need io for server-to-server communication
var io = require('socket.io-client')

var ServerExchange = require('./html/server/ServerExchange.js');
var GateKeeperInfo = require('./html/server/GateKeeperInfo.js');
var ServerInfo = require('./html/server/ServerInfo.js');
var ServerSettings = require('./ServerSettings.js');

// **** COMMAND LINE PROCESSING ****

module.exports = function(name, host, port, capacity, password) {

	if(!name) {
		name = ServerSettings.defaults.name;
	}
	if(!host) {
		host = ServerSettings.defaults.host;
	}
	if(!port) {
		port = ServerSettings.defaults.port;
	}
	if(!capacity) {
		capacity = ServerSettings.defaults.capacity;
	}
	if(!password) {
		password = ServerSettings.defaults.password;
	}

	// TODO: look at command line args for server, if possible
	// for key in process.argv, if we want to overwrite any of these properties, do so
	for(var i=3;i<process.argv.length;i+=2) {
		var key = process.argv[i-1];
		var value = process.argv[i];
		if(key == "-n") {
			name = value;
		} else if(key == "-g") {
			host = value
		} else if(key == "-p") {
			port = value;
		} else if(key == "-s") {
			password = value;
		}
	}

	console.log

	var server = {
		name: name,
		host: host,
		port: port,
		capacity: capacity,
		password: password,
		connections: [], // connections is a list of all connections, no auth necessary
		clients: [], // clients is a list of all authenticated clients
		onConnect: null,
		onDisconnect: null,
		onMessage: null,
		onError: null,
		// returns a server info object
		getInfo: function() {
			// does this grab the proper "this"?
			return ServerInfo.new(name, host, port, this.clients.length, capacity, password);
		},
		broadcast: function(key, payload) {
			for(i in this.clients) {
				this.send(this.clients[i], key, payload);
			}
		},
		send: function(client, key, payload) {
			var exc = ServerExchange.new(key, payload);
			client.send(JSON.stringify(exc));
		}
	};

	server.gateKeeper = gateKeeper = io.connect('http://'+host);
	server.gateKeeper.on('connect', function () {
		// as a server, when we connect to gatekeeper, we should inform him of our info
		// he'll ask anyway though, so let's leave this for now
	});
	server.gateKeeper.on('disconnect', function () {
		// connection to the server went down
		// TODO: alert current players, and try to re-connect?
	});
	gateKeeper.on('message', function (event) {
		var exc = ServerExchange.import(event);
		if(exc.key == "ServerInfo") {
			server.sendUpdatedInfo();
		} else {
			console.log("unknown message type: "+exc.key+" sent to server from gatekeeper: "+JSON.stringify(exc.payload));
		}
	});

	server.sendUpdatedInfo = function() {
		var info = this.getInfo();
		this.gateKeeper.emit("message", JSON.stringify(ServerExchange.new("ServerInfo", info)));
	}

	server.gateKeeper.connect();



	// TODO: rename, authenticateClient?
	// confirmClient? something that confers this client has been authenticated
	server.addClient = function(connection) {
		// TODO: oauth stuff?
		connection.authorized = true;
		server.clients.push(connection);
		server.sendUpdatedInfo();
		/*for(key in chatHistory) {
			connection.send(chatHistory[key]);
		}*/
		// callback for adding a client
		if(server.onConnect) {
			server.onConnect(connection);
		}
	}

	server.clientSocket = ws.createServer({port:port}, function (connection) {
		// client has connected to our server, add it to connections
		server.connections.push(connection);
		connection.authorized = false;

		if(password) {
			server.send(connection, "password", null);
		} else {
			server.addPlayer(connection);
		}

		connection.onmessage = function(event) {
			// TODO: try catch! User might try to break the server
			
			var exc = ServerExchange.import(event.data);

			if(!connection.authorized && exc.key == "password") {
				if(exc.payload == password) {
					// oauth here?
					server.addClient(connection);
				} else {
					server.send(connection, "password", null);
				}
			} else if(connection.authorized && server.onMessage) {
				server.onMessage(connection, exc.key, exc.payload);
			}

		};

		connection.onclose = function() {
			//the client left the game server
			server.connections.splice(server.connections.indexOf(connection), 1);
			server.clients.splice(server.clients.indexOf(connection), 1);

			// remember to tell gatekeeper your stats changed
			server.sendUpdatedInfo();

			if(server.onDisconnect && connection.authenticated) {
				server.onDisconnect(connection);
			}
		};
	});

	return server;
}





