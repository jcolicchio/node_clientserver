// This is a smart object representation of the individual server
// It tells the GateKeeper(and thus the client) how to connect
// ServerName, Players, IP, port, public facing stuff
// This is the public info you'd see whenever you ask for a listing of, say, TF2 servers

// Note, don't put any sort of passwords for private servers here
// The user can inspect this object
// Instead, only note that the server is password protected,
// And as part of your own protocol, have the user send a Password.js object
// The server can then terminate the connection or something, if the password doesn't match

// Note: rather than populating the IP field, leave it blank when sending to the GateKeeper
// The gatekeeper will note the IP of the connection and fill it in automatically
// This is much easier than having the server figure out its own IP

// TODO: add a 'type' field to server info
// this is so that, if the gatekeeper allows multiple kinds of servers to connect
// it can tell which is which
// client-side, clients can differentiate between various types and filter down to only
// the kinds of servers which the client can use
// for instance, say 2 "Gomoku" servers and 1 "chess" server both want to connect to GK
// if GK is configured to allow multiple server types, then clients need to either request all servers of type X
// or clients can just client-side filter results to match their needs

(function(exports){

	var Protocol = this['Protocol'];
	if(Protocol === undefined) {
		Protocol = require('./Protocol.js');	
	}

	exports.new = function(name, type, ip, port, players, capacity, hasPassword) {
		return {
			name: name,
			type: type,
			ip: ip,
			port: port,
			players: players,
			capacity: capacity,
			hasPassword: hasPassword,
			serverString: function() {
				return this.ip + ":" + this.port;
			}
		}
	}
	exports.copy = function(si) {
		if(si === null) {
			return null;
		}
		return exports.new(si.name, si.type, si.ip, si.port, si.players, si.capacity, si.hasPassword);
	}
	exports.import = function(json) {
		return exports.copy(JSON.parse(json));
	}

	// **** Protocol Registration ****

	// TODO: make sure to mention that every smart class needs to register with Protocol!
	Protocol.register("ServerList", function(payload) {
		//we're assuming payload is a list of ServerInfo objects
		var serverList = [];
		for(key in payload) {
			serverList[key] = exports.copy(payload[key]);
		}
		return serverList;
	});

	Protocol.register("ServerInfo", function(payload) {
		// we're assuming the payload is a ServerInfo
		return exports.copy(payload);
	});

})(typeof exports === 'undefined'? this['ServerInfo']={}: exports);