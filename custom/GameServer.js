var Server = require('../Server.js')(null, "Game");

var Player = require('../html/game/Player.js');

var players = [];
var playerId = 0;

Server.onConnect = function(client) {
	Server.send(client, "joined", null);

	var player = Player.new(++playerId, "Anon"+playerId, {x: 20, y: 20}, "red");
	client.player = player;
	
	Server.send(client, "Player", player);

	var list = [];
	for(key in Server.clients) {
		list.push(Server.clients[key].player);
	}
	Server.broadcast("PlayerList", list);
}

Server.onDisconnect = function(client) {
	var player = client.player;
	
	var list = [];
	for(key in Server.clients) {
		list.push(Server.clients[key].player);
	}
	Server.broadcast("PlayerList", list);
}

Server.onMessage = function(client, key, payload) {
	if(key == "Player" && client.player.id == payload.id) {
		client.player.name = payload.name;
		client.player.pos = payload.pos;
		client.player.color = payload.color;

		var list = [];
		for(key in Server.clients) {
			list.push(Server.clients[key].player);
		}
		Server.broadcast("PlayerList", list);
	}
}

Server.onError = function(client, error) {
	console.log("error! "+error);
}