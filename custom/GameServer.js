// require Server.js, create with null name, "Game" type, ignore the rest of the params, use default
var Server = require('../Server.js')({type: "Game"});

// require Player.js on the server side, this smart object is passed back and forth between client and server
var Player = require('../html/custom/game/Player.js');

// keep iterating player count as players join
var playerId = 0;

Server.onConnect = function(client) {
	// when the client connects AND authenticates, send the client a "joined message"
	// this is arbitrary, we use this as client to verify the authentication went through
	Server.send(client, "joined", null);

	// create a new player and assign it to the client, this is persistent for the duration of the connection
	var player = Player.new(++playerId, "Anon"+playerId, {x: 20, y: 20}, "red");
	client.player = player;
	
	// send the client itself so it knows its id, name
	Server.send(client, "Player", player);

	// generate a list of players for each client
	var list = [];
	for(key in Server.clients) {
		list.push(Server.clients[key].player);
	}

	// send everyone the player list, with each player's position and color being up to date
	Server.broadcast("PlayerList", list);
}

Server.onDisconnect = function(client) {
	
	// update everyone with a new list of players, the client has already been removed and won't be updated
	// but if we wanted the player which was removed, we could grab it with client.player one last time
	// say, for a death animation or something, idk
	var list = [];
	for(key in Server.clients) {
		list.push(Server.clients[key].player);
	}
	Server.broadcast("PlayerList", list);
}

Server.onMessage = function(client, key, payload) {
	// when we receive a message from a client, if it's a player whose ID matches the client's player ID:
	if(key == "Player" && client.player.id == payload.id) {
		// the client has sent us a player, it wants to update the player's name, pos, and color if changed
		client.player.name = payload.name;
		client.player.pos = payload.pos;
		client.player.color = payload.color;

		// broadcast this update to all clients with a fresh PlayerList
		var list = [];
		for(key in Server.clients) {
			list.push(Server.clients[key].player);
		}
		Server.broadcast("PlayerList", list);
	}
}

Server.onError = function(client, error) {
	// just console log it
	console.log("error! "+error);
}

Server.connect();