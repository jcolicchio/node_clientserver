var ws = require('ws');

var Player = require('./Player.js');
var GameState = require('./GameState.js');
var Input = require('./Input.js');
//var NetworkedGoBoard = require('./NetworkedGoBoard.js');
var ServerExchange = require('./ServerExchange.js');
var Settings = require('./Settings.js');
var GenericServer = require('./GenericServer.js');

GenericServer.init(Settings.webPort);


//var board = NetworkedGoBoard.new(null, null, GoBoard.new(11), []);
var board = GameState.new();

var names = ["dingus", "testplayer"];

var serverClockRate = 40;
var serverBlastRate = 3;

var server = ws.createServer({port:Settings.socketPort}, function (connection) {
	this.addConnectionWithName(connection, board.players.length < names.length ? names[board.players.length] : "specN");
	
	connection.onmessage = function(event) {
		var str = event.data;
		//console.log("player "+connection.player.id+" said "+str);
		
		//console.log("new, now we're processing it!");
		var exc = ServerExchange.import(str);
		if(exc.type == ServerExchange.TYPE.GOBOARD) {
			if(exc.key == ServerExchange.KEY.GOBOARD.STATE) {
			//console.log("player "+connection.player.name+" wants board state");
			var response = server.exchangeForBoard(board);
			connection.send(JSON.stringify(response));
			} else if(exc.key == ServerExchange.KEY.GOBOARD.SWITCH || exc.key == ServerExchange.KEY.GOBOARD.RESET) {
				//if this player is an active player, reset and switch
				if(connection.player.equal(board.whitePlayer) || connection.player.equal(board.blackPlayer)) {
					if(exc.key == ServerExchange.KEY.GOBOARD.SWITCH) {
						var player = board.whitePlayer;
						board.whitePlayer = board.blackPlayer;
						board.blackPlayer = player;
					}
					//board.board.init();
					server.broadcast(JSON.stringify(server.exchangeForBoard(board)));
				}
			} else if(exc.key == ServerExchange.KEY.GOBOARD.LEAVE) {
				//remove from server, re-add to server
				server.removePlayer(connection.player);
				server.addPlayer(connection.player);
			}
		} else if(exc.type == ServerExchange.TYPE.PLAYER) {
			if(exc.key == ServerExchange.KEY.PLAYER.SELF) {
				if(exc.payload !== null && exc.payload !== undefined) {
					//console.log("player "+connection.player.name+" wants to be called "+exc.payload.name);
					for(key in board.players) {
						if(board.players[key].equal(connection.player)) {
							board.players[key].name = exc.payload.name;
							break;
						}
					}
					connection.player.name = exc.payload.name;
					server.broadcast(JSON.stringify(server.exchangeForBoard(board)));
				}
				//console.log("player "+connection.player.name+" wants self player object");
				connection.send(JSON.stringify(server.exchangeForSelfPlayer(connection.player)));
			}
		} else if(exc.type == ServerExchange.TYPE.INPUT) {

			//var response = ServerExchange.new(ServerExchange.TYPE.COMMAND, ServerExchange.KEY.COMMAND.RESPONSE, false);
			//console.log("player "+connection.player.name+" sent command: "+exc.payload.x+", "+exc.payload.y);
			//if(board.players.length >= 2) {
			//	var command = exc.payload;
			//	command.player = connection.player;
			//	var outcome = board.applyCommand(command);
			//	response.payload = outcome;
			//}

			//connection.send(JSON.stringify(response));

			//exc = server.exchangeForBoard(board);
			//server.broadcast(JSON.stringify(exc));

			connection.player.input = exc.payload;
		}
		
	};
	connection.onclose = function() {
		server.removeConnection(connection);
		
		var exc = server.exchangeForBoard(board);
		server.broadcast(JSON.stringify(exc));
	};
});


//server.players = [];
server.connections = [];
server.nextPlayerId = 0;
server.addConnectionWithName = function(connection, name) {
	var player = Player.new(this.nextPlayerId++, name);
	player.position.x = 0;
	player.position.y = 10;
	connection.player = player;
	this.connections.push(connection);
	
	this.addPlayer(player);

	connection.send(JSON.stringify(server.exchangeForSelfPlayer(player)));
};
server.addPlayer = function(player) {
	board.players.push(player);
	/*if(board.players.length == 1) {
		board.blackPlayer = player;
	} else if(board.players.length == 2) {
		if(board.whitePlayer === undefined || board.whitePlayer === null) {
			board.whitePlayer = player;
		} else {
			board.blackPlayer = player;
		}
	}*/

	this.broadcast(JSON.stringify(this.exchangeForBoard(board)));

	return player;
};
server.removeConnection = function(connection) {
	for(key in this.connections) {
		if(this.connections[key] == connection) {
			this.connections.splice(key,1);
			break;
		}
	}
	server.removePlayer(connection.player);
};
server.removePlayer = function(player) {
	for(key in board.players) {
		if(player.equal(board.players[key])) {
			board.players.splice(key,1);
			break;
		}
	}
	
	
}
server.connectionForPlayer = function(player) {
	for(connection in this.connections) {
		if(this.connections[connection].player.equal(player)) {
			return this.connections[connection];
		}
	}
	return null;
}
server.broadcast = function(str) {
	board.players.forEach(function (player) {
		var connection = server.connectionForPlayer(player);
		connection.send(str);
	});
}

server.exchangeForBoard = function(board) {
	return ServerExchange.new(ServerExchange.TYPE.GAMESTATE, ServerExchange.KEY.GAMESTATE.STATE, board);
}
server.exchangeForSelfPlayer = function(player) {
	return ServerExchange.new(ServerExchange.TYPE.PLAYER, ServerExchange.KEY.PLAYER.SELF, player);
}

//game loop time?

setInterval(function(){
	board.update();
}, 1000/serverClockRate);

//every 10 ms, send the updated game state to all clients
setInterval(function(){
	server.broadcast(JSON.stringify(server.exchangeForBoard(board)))
	;
}, 1000/serverBlastRate);