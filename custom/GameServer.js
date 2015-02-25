// create server "GameServer" at joecolicch.io:8080 with port 12350, capacity 8, password "dingus"


var Server = require('../Server.js')("GameServer", "joecolicch.io:8080", 12350, 8, "dingus");

var Player = require('../html/server/GameServer/Player.js');

// not implemented, since we're using default
//Server.getInfo = function() {
//	return ServerInfo.new("GameServer")
//}

var players = [];

Server.onConnect = function(client) {
	players[client] = Player.new(42, "Anon132");
}

Server.onDisconnect = function(client) {
	delete players[client];
}

Server.onMessage = function(client, key, payload) {
	if(key == "message") {
		Server.broadcast("message", players[client].name+": "+payload);
	} else if(key == "Player") {
		players[client].name = payload.name;
	}
}

Server.onError = function(client, error) {
	//console.log("error!");
}


// some pre-defined methods
// onMessage is called with client, and their key and payload of their exchange
// Server.broadcast = function(key, payload) { // send message to all clients}

// Server.send(client, key, payload)

//	Server.getInfo = function() {
//		return ServerInfo.new(Server.name, Server.host, Server.port, Server.);
//	}