var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var ws = require('ws');

var Player = require('./Player.js');
var GoBoard = require('./GoBoard.js');
var Command = require('./Command.js');
var NetworkedGoBoard = require('./NetworkedGoBoard.js');
var ServerExchange = require('./ServerExchange.js');

http.createServer(function (request, response) {
  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);
  
  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }
 
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }
 
      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(80);


console.log("Server running at http://127.0.0.1:80/");

var board = NetworkedGoBoard.new(null, null, GoBoard.new(11), []);

var names = ["dingus", "testplayer"];

//let's make a ws server running on some port, idk, 12345
var server = ws.createServer({port:12345}, function (connection) {
	this.addConnectionWithName(connection, board.players.length < names.length ? names[board.players.length] : "specN");
	
	connection.onmessage = function(event) {
		var str = event.data;
		console.log("player "+connection.player.id+" said "+str);
		
		console.log("new, now we're processing it!");
		var exc = ServerExchange.import(str);
		if(exc.type == ServerExchange.TYPE.GOBOARD) {
			if(exc.key == ServerExchange.KEY.GOBOARD.STATE) {
			console.log("player "+connection.player.name+" wants board state");
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
					board.board.init();
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
					console.log("player "+connection.player.name+" wants to be called "+exc.payload.name);
					for(key in board.players) {
						if(board.players[key].equal(connection.player)) {
							board.players[key].name = exc.payload.name;
							break;
						}
					}
					connection.player.name = exc.payload.name;
					server.broadcast(JSON.stringify(server.exchangeForBoard(board)));
				}
				console.log("player "+connection.player.name+" wants self player object");
				connection.send(JSON.stringify(ServerExchange.new(ServerExchange.TYPE.PLAYER, ServerExchange.KEY.PLAYER.SELF, connection.player)));
			} else if(exc.key == ServerExchange.KEY.PLAYER.OPPONENT) {
				console.log("player "+connection.player.name+" wants opponent player object");
			} else if(exc.key == ServerExchange.KEY.PLAYER.LIST) {
				console.log("player "+connection.player.name+" wants list");
				//connection.send(JSON.stringify(ServerExchange.new(ServerExchange.TYPE.PLAYER, ServerExchange.KEY.PLAYER.LIST, board.players)));
			}
		} else if(exc.type == ServerExchange.TYPE.COMMAND) {
			var response = ServerExchange.new(ServerExchange.TYPE.COMMAND, ServerExchange.KEY.COMMAND.RESPONSE, false);
			console.log("player "+connection.player.name+" sent command: "+exc.payload.x+", "+exc.payload.y);
			if(board.players.length >= 2) {
				var command = exc.payload;
				command.player = connection.player;
				var outcome = board.applyCommand(command);
				response.payload = outcome;
			}
			connection.send(JSON.stringify(response));
			exc = server.exchangeForBoard(board);
			server.broadcast(JSON.stringify(exc));
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
	connection.player = player;
	this.connections.push(connection);
	
	this.addPlayer(player);
};
server.addPlayer = function(player) {
	board.players.push(player);
	if(board.players.length == 1) {
		board.blackPlayer = player;
	} else if(board.players.length == 2) {
		if(board.whitePlayer === undefined || board.whitePlayer === null) {
			board.whitePlayer = player;
		} else {
			board.blackPlayer = player;
		}
	}
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
	if(player.equal(board.whitePlayer)) {
		board.whitePlayer = null;
		board.board.init();
		for(key in board.players) {
			if(!board.players[key].equal(board.blackPlayer)) {
				board.whitePlayer = board.players[key];
				break;
			}
		}
	} else if(player.equal(board.blackPlayer)) {
		board.blackPlayer = null;
		board.board.init();
		for(key in board.players) {
			if(!board.players[key].equal(board.whitePlayer)) {
				board.blackPlayer = board.players[key];
				break;
			}
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
	return ServerExchange.new(ServerExchange.TYPE.GOBOARD, ServerExchange.KEY.GOBOARD.STATE, board);
}
