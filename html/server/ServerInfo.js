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

(function(exports){
	//	Theoretically, since smart objects are useless without ServerExchange
	//	We could probably make each smart object require ServerExchange
	//	Then have it register itself!
	//	Is that true? Can we grab THE ServerExchange? I think it'll just create a new one
	//	I have a feeling it'll work client side, but not server side

	//	var ServerExchange = this['ServerExchange'];
	//	if(ServerExchange === undefined) {
	//		ServerExchange = require('./ServerExchange.js');	
	//	}

	ServerInfo = {};
	ServerInfo.new = function(name, ip, port, players, capacity, hasPassword) {
		var serverInfo = {
			name: name,
			ip: ip,
			port: port,
			players: players,
			capacity: capacity,
			hasPassword: hasPassword
		}

		return serverInfo;
	}
	ServerInfo.copy = function(si) {
		if(si === null) {
			return null;
		}
		return ServerInfo.new(si.name, si.port, si.players, si.capacity, si.hasPassword);
	}
	ServerInfo.import = function(json) {
		return ServerInfo.copy(JSON.parse(json));
	}
	
	exports.new = ServerInfo.new;
	exports.copy = ServerInfo.copy;
	exports.import = ServerInfo.import;

})(typeof exports === 'undefined'? this['ServerInfo']={}: exports);
