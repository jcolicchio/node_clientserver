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

// You also have access to properties:
// name, host, port, capacity, password
// clients - list of authenticated clients

// And convenience methods:
// broadcast(key, payload) - send a key/payload ServerExchange to all clients
// send(client, key, payload) - send key/payload ServerExchange to one client
// sendUpdatedInfo() - update the GateKeeper by calling getInfo() and sending

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

module.exports = function(options) {
	// name, type, host, port, capacity, password

	if(!options.name) {
		options.name = ServerSettings.defaults.name;
	}
	if(!options.type) {
		options.type = ServerSettings.defaults.type;
	}
	if(!options.host) {
		options.host = ServerSettings.defaults.host;
	}
	if(!options.port) {
		options.port = ServerSettings.defaults.port;
	}
	if(!options.capacity) {
		options.capacity = ServerSettings.defaults.capacity;
	}
	if(!options.password) {
		options.password = ServerSettings.defaults.password;
	}

	for(var i=3;i<process.argv.length;i+=2) {
		var key = process.argv[i-1];
		var value = process.argv[i];
		if(key == "-n") {
			options.name = value;
		} else if(key == "-g") {
			options.host = value
		} else if(key == "-p") {
			options.port = value;
		} else if(key == "-s") {
			options.password = value;
		}
	}

	// TODO: verify port is numeric, or crash

	var server = {
		name: options.name,
		type: options.type,
		host: options.host,
		port: options.port,
		capacity: options.capacity,
		password: options.password,

		clients: [], // clients is a list of all authenticated clients

		// TODO: consider renaming onClientConnect
		// or server.client.onConnect, etc
		onConnect: null,
		onDisconnect: null,
		onMessage: null,
		onError: null,
		getInfo: function() {
			return ServerInfo.new(this.name, this.type, this.host, this.port, this.clients.length, this.capacity, this.password);
		},

		broadcast: function(key, payload) {
			for(i in this.clients) {
				this.send(this.clients[i], key, payload);
			}
		},
		send: function(client, key, payload) {
			var exc = ServerExchange.new(key, payload);
			client.send(JSON.stringify(exc));
		},
		sendUpdatedInfo: function() {
			var info = this.getInfo();
			this.private.gateKeeper.emit("message", JSON.stringify(ServerExchange.new("ServerInfo", info)));
		},

		private: {
			connections: [], // no auth necessary, all connections to server auth or no
			clientAuthenticated: function(connection) {
				// TODO: oauth stuff?
				connection.authenticated = true;
				server.clients.push(connection);
				server.sendUpdatedInfo();

				if(server.onConnect) {
					server.onConnect(connection);
				}
			},
			gateKeeper: null,
			clientSocket: null
		},

		connect: function(){

			// set up gatekeeper communication
			server.private.gateKeeper = io.connect('http://'+this.host);
			server.private.gateKeeper.on('connect', function () {
				// as a server, when we connect to gatekeeper, we should inform him of our info
				// he'll ask anyway though, so let's leave this for now
			});
			server.private.gateKeeper.on('disconnect', function () {
				// connection to the server went down
				// TODO: alert current players, and try to re-connect?
				if(server.onError) {
					server.onError(null, "Server disconnected from GateKeeper");
				}
			});
			server.private.gateKeeper.on('message', function (event) {
				var exc = ServerExchange.import(event);
				if(exc.key == "ServerInfo") {
					server.sendUpdatedInfo();
				} else {
					console.log("unknown message type: "+exc.key+" sent to server from gatekeeper: "+JSON.stringify(exc.payload));
				}
			});
			this.private.gateKeeper.connect();

			// set up client socket stuff
			server.private.clientSocket = ws.createServer({port:options.port}, function (connection) {

				server.private.connections.push(connection);
				connection.authenticated = false;

				if(options.password) {
					server.send(connection, "password", null);
				} else {
					server.private.clientAuthenticated(connection);
				}

				connection.onmessage = function(event) {
					// TODO: try catch! User might try to break the server

					// TODO: probably strip out any user text that has HTML or stuff?
					// or should we just leave that to the custom implementation
					
					var exc = ServerExchange.import(event.data);

					if(!connection.authenticated && exc.key == "password") {
						if(exc.payload == options.password) {
							// oauth here?
							server.private.clientAuthenticated(connection);
						} else {
							server.send(connection, "password", null);
						}
					} else if(connection.authenticated && server.onMessage) {
						server.onMessage(connection, exc.key, exc.payload);
					}

				};

				connection.onclose = function() {
					//the client left the game server
					server.private.connections.splice(server.private.connections.indexOf(connection), 1);
					server.clients.splice(server.clients.indexOf(connection), 1);

					// remember to tell gatekeeper your stats changed
					server.sendUpdatedInfo();

					if(server.onDisconnect && connection.authenticated) {
						server.onDisconnect(connection);
					}
				};

				connection.onerror = function() {
					console.log("error occurred!");
					if(server.onError) {
						server.onError(connection, "connection error, no info given");
					}
				}
			});
		}
	};

	

	return server;
}





