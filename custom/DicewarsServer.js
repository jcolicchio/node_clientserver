// require Server.js, create with null name, "Game" type, ignore the rest of the params, use default
var Server = require('../Server.js')({type: "Dicewars"});

var Player = require('../html/custom/dicewars/Player.js');
var Board = require('../html/custom/dicewars/Board.js');
var Command = require('../html/custom/dicewars/Command.js');

// keep iterating player count as players join
var playerId = 0;

var board = null;
var teams = 2;
var gameStarted = false;
var gamePlayers = [];
var boardWidth = 5;
var boardHeight = 5;

var broadcastPlayers = function() {
	// generate a list of players for each client
	var list = [];
	for(key in Server.clients) {
		var player = Server.clients[key].player;
		list.push(player);
		if(player.team != gamePlayers.indexOf(player)) {
			player.team = gamePlayers.indexOf(player);
			Server.send(Server.clients[key], "Player", player);
		}
	}

	// send everyone the player list, with each player's position and color being up to date
	Server.broadcast("PlayerList", list);
}

Server.onConnect = function(client) {

	// create a new player and assign it to the client, this is persistent for the duration of the connection
	var player = Player.new(++playerId, "Anon"+playerId, {x: 20, y: 20}, "red");
	client.player = player;
	
	// send the client itself so it knows its id, name
	Server.send(client, "Player", player);
	console.log("sent "+JSON.stringify(player));

	if(gameStarted) {
		Server.send(client, "Board", board);
	} else {
		if(gamePlayers.length < teams) {
			gamePlayers.push(player);

			if(gamePlayers.length == teams) {
				gameStarted = true;
				board = Board.new(boardWidth, boardHeight, null, teams, 0).init();
				Server.broadcast("Board", board);
			}
		}
	}

	broadcastPlayers();
}

Server.onDisconnect = function(client) {
	
	// update everyone with a new list of players, the client has already been removed and won't be updated
	// but if we wanted the player which was removed, we could grab it with client.player one last time
	// say, for a death animation or something, idk

	if(gamePlayers.indexOf(client.player) >= 0) {
		gamePlayers.splice(gamePlayers.indexOf(client.player), 1);
		// reset the board, if there are enough clients to do dis, we need to find one more to add
		if(Server.clients.length >= teams) {
			for(key in Server.clients) {
				if(gamePlayers.indexOf(Server.clients[key].player) == -1) {
					gamePlayers.push(Server.clients[key].player);
					board = Board.new(boardWidth, boardHeight, null, teams, 0).init();
					Server.broadcast("Board", board);
					break;
				}
			}
		} else {
			gameStarted = false;
			board = null;
			Server.broadcast("Board", board);
		}
	}

	broadcastPlayers();
}

Server.onMessage = function(client, key, payload) {
	// when we receive a message from a client, if it's a player whose ID matches the client's player ID:
	if(key == "Player" && client.player.id == payload.id) {
		// the client has sent us a player, it wants to update the player's name, pos, and color if changed
		client.player.name = payload.name;
		client.player.pos = payload.pos;
		client.player.color = payload.color;

		broadcastPlayers();

	} else if(key == "Command") {
		// received a command from a player
		if(gameStarted && gamePlayers.indexOf(client.player) == board.turn) {
			var result = board.applyCommand(payload);
			if(result) {
				Server.broadcast("Board", board);
				if(result !== true) {
					payload.result = result;
					Server.broadcast("Command", payload);
				}
			}
		}
	}
}

Server.onError = function(client, error) {
	// just console log it
	console.log("error! "+error);
}

Server.connect();