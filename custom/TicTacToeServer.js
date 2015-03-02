// require Server.js, create with null name, "Game" type, ignore the rest of the params, use default
var Server = require('../Server.js')({type: "TicTacToe"});

// require Player.js on the server side, this smart object is passed back and forth between client and server
var Player = require('../html/custom/tictactoe/Player.js');
var Board = require('../html/custom/tictactoe/Board.js');

// keep iterating player count as players join
var board;
var playerId = 0;
var gamePlayers = [];
var teams = 2;
var gameStarted = false;

var broadcastPlayers = function() {
    var list = [];
    for(key in Server.clients) {
        var player = Server.clients[key].player;
        list.push(player);
        if(player.team != gamePlayers.indexOf(player)){
            player.team = gamePlayers.indexOf(player);
            Server.send(Server.clients[key], "Player", player);
        }
    }
    Server.broadcast("PlayerList", list);
}

Server.onConnect = function(client) {

	// create a new player and assign it to the client, this is persistent for the duration of the connection
	var player = Player.new(++playerId, "Anon"+playerId, {x: 20, y: 20}, "red");
	client.player = player;
	
	// send the client itself so it knows its id, name
	Server.send(client, "Player", player);
    
    if (gameStarted) {
        Server.send(client, "Board", board);
    }else{
        if (gamePlayers.length < teams)
            gamePlayers.push(player);
            
            if (gamePlayers.length == teams) {
                gameStarted = true;
                board = Board.new(0,teams,null);
                Server.broadcast("Board", board);
            }
    }
	// generate a list of players for each client
	var list = [];
	for(key in Server.clients) {
		list.push(Server.clients[key].player);
	}

	// send everyone the player list, with each player's position and color being up to date
	//Server.broadcast("PlayerList", list);
    broadcastPlayers();
}

Server.onDisconnect = function(client) {
	
	// update everyone with a new list of players, the client has already been removed and won't be updated
	// but if we wanted the player which was removed, we could grab it with client.player one last time
	// say, for a death animation or something, idk

    if (gamePlayers.indexOf(client.player) >= 0) {
        gamePlayers.splice(gamePlayers.indexOf(client.player), 1);
        if(Server.clients.length >= teams) {
            for(key in Server.clients) {
                if(gamePlayers.indexOf(Server.clients[key].player) == -1) {
                    gamePlayers.push(Server.clients[key].player);
                    board = Board.new(0,teams,null).init();
                    Server.broadcast("Board",board);
                    break;
                }
            }
        } else {
            gameStarted = false;
            //board = null;
            board = Board.new(0,teams,null).init();
            Server.broadcast("Board", board);
        }
    }
    broadcastPlayers();
}

Server.onMessage = function(client, key, payload) {
	// when we receive a message from a client, if it's a player whose ID matches the client's player ID:
	if(key == "coord") {
		var x = payload.x;
		var y = payload.y;
		var temp = payload;
		temp.x = Math.floor(x/100);
		temp.y = Math.floor(y/100);
		console.log("server received coord"+x+", "+y);
		if (board === undefined || board === null)
			board = Board.new(0,teams,null).init();
		var outcome = board.applyCommand(1,temp);
		Server.broadcast("Board", board); 
	}
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
