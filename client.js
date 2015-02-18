var ngb = null;
var connection;
var playerSelf = null;
var connected = false;
var playerList = null;

var Settings = this['Settings'];
	
if(Settings === undefined) {
	console.log(this['Settings']);
	Settings = require('./Settings.js');
}

$(document).ready(function(){


	
	//board = GoBoard.default();

	var gameActive = function() {
		var ret = (ngb !== null && ngb.active());
		return ret;
	}
	var team = function() {
		if(ngb === null) {
			return GoBoard.TEAM.EMPTY;
		}
		if(playerSelf === null) {
			return GoBoard.TEAM.EMPTY;
		}
		if(playerSelf.equal(ngb.whitePlayer)) {
			return GoBoard.TEAM.WHITE;
		} else if(playerSelf.equal(ngb.blackPlayer)) {
			return GoBoard.TEAM.BLACK;
		} else {
			return GoBoard.TEAM.EMPTY;
		}
	}
	var opponent = function() {
		if(team() == GoBoard.TEAM.EMPTY) {
			//you have no opponent, spec
			return null;
		}
		if(team() == GoBoard.TEAM.WHITE) {
			return ngb.blackPlayer;
		} else if(team() == GoBoard.TEAM.BLACK) {
			return ngb.whitePlayer;
		}
	}
	
	var updateBoard = function(board) {
		if(board !== null) {
			$('#board').replaceWith(makeBoard(board));
		}
	}
	var updateInfo = function() {
		$('#info').replaceWith(makeInfo());
	}
	var updateUI = function() {
		if(ngb !== null) {
			updateBoard(ngb.board);
		} else {
			console.log("ngb was null");
			updateBoard(null);
		}
		updateInfo();
		if(team() === GoBoard.TEAM.EMPTY) {
			$('input#resetbutton').hide();
			$('input#switchbutton').hide();
			$('input#leavebutton').hide();
		} else {
			$('input#resetbutton').show();
			$('input#switchbutton').show();
			$('input#leavebutton').show();
		}
	}

	var clickCell = function(x, y) {
		if(ngb === null || !ngb.active() || team() == GoBoard.TEAM.EMPTY ) {
			return;
		}
		ngb.board.placePiece(team(), x, y);
		updateBoard(ngb.board);
	}
	
	var makeBoard = function(board) {
		var boardDiv = $("<div id='board'></div>");
		console.log(board);
		if(board !== null) {
			for(var i=0;i<board.size;i++) {
				var row = $("<div class='row'></div>");
				for(var j=0;j<board.size;j++) {
					var team = "cell";
					if(board.data[i][j] == GoBoard.TEAM.WHITE) {
						team += " white";
					} else if(board.data[i][j] == GoBoard.TEAM.BLACK) {
						team += " black";
					}
					var cell = $("<div class='"+team+"'></div>");
					row.append(cell);
					cell.data("i", i);
					cell.data("j", j);
				}
				boardDiv.append(row);
			}
		}
		return boardDiv;
	}
	var makeInfo = function() {
		var info = $("<div id='info'></div>");
		if(!connected) {
			info.append("Not connected to server<br/>");
			return info;
		}
		if(playerSelf !== null) {
			info.append("You: "+playerSelf.name);
			if(team() === GoBoard.TEAM.WHITE) {
				info.append("(White)");
			} else if(team() === GoBoard.TEAM.BLACK) {
				info.append("(Black)");
			}
			info.append("<br/>");
		}
		if(opponent() !== null) {
			info.append("Opponent: "+opponent().name+"("+(team() == GoBoard.TEAM.WHITE ? "Black" : "White")+")"+"<br/>");
		}
		if(ngb !== null) {
			if(ngb.active()) {
				var winner = ngb.board.winner();
				if(winner == GoBoard.TEAM.EMPTY) {
					info.append("It is ");
					if(team() == ngb.board.turn) {
						info.append("your ");
					} else {
						if(ngb.board.turn == GoBoard.TEAM.WHITE) {
							info.append(ngb.whitePlayer.name+"'s ");
						} else if(ngb.board.turn == GoBoard.TEAM.BLACK) {
							info.append(ngb.blackPlayer.name+"'s ");
						}
					}
					info.append("turn<br/>");
				} else {
					if(team() == winner) {
						info.append("You win!");	
					} else if(team() != GoBoard.TEAM.EMPTY) {
						info.append("You lose");
					} else if(winner == GoBoard.TEAM.WHITE) {
						info.append(ngb.whitePlayer.name+"(White) wins!");
					} else {
						info.append(ngb.blackPlayer.name+"(Black) wins!");
					}
					info.append("<br/>");
				}
			} else {
				info.append("Waiting for opponent...<br/>");
			}
			info.append("<br/>Players:<br/>");
			for(key in ngb.players) {
				info.append(ngb.players[key].name);
				if(ngb.players[key].equal(ngb.whitePlayer)) {
					info.append("(White)");
				} else if(ngb.players[key].equal(ngb.blackPlayer)) {
					info.append("(Black)");
				}
				info.append("<br/>");
			}
		} else {
			info.append("Waiting for opponent...<br/>");
		}
		return info;
	}

	var board = null;
	if(ngb !== null) {
		board = ngb.board;
	}
	var div = makeBoard(board);
	$('body').append(div);
	$('body').on('click', '.cell', function(){
		var x = $(this).data("j");
		var y = $(this).data("i");
		clickCell(x, y);
		var p = Player.new(42, "currentPlayer", null);
		var cmd = Command.new(p, x, y);
		console.log(p);
		console.log(cmd);

		var exc = ServerExchange.new(ServerExchange.TYPE.COMMAND, ServerExchange.TYPE.COMMAND.REQUEST, Command.new(playerSelf, x, y));
		connection.send(JSON.stringify(exc));
	});
	var info = makeInfo();
	$('body').append(info);

	$('body').append("<input id='name' name='name' /><input id='namebutton' type='submit' value='Name' /><br/>");
	$('body').on('click', 'input#namebutton', function() {
		//alert($('input#name').val());
		var newName = $('input#name').val();
		playerSelf.name = newName;
		connection.send(JSON.stringify(ServerExchange.new(ServerExchange.TYPE.PLAYER, ServerExchange.KEY.PLAYER.SELF, playerSelf)));
		$('input#name').val("");
	});
	$('body').on('keypress', 'input#name', function(e) {
		if(e.which == 13) {
			$('input#namebutton').click();
		}
	});

	$('body').append("<input id='resetbutton' type='submit' value='Reset' />");
	$('body').append("<input id='switchbutton' type='submit' value='Switch' />");
	$('body').append("<input id='leavebutton' type='submit' value='Leave' />");
	$('body').on('click', 'input#resetbutton', function() {
		connection.send(JSON.stringify(ServerExchange.new(ServerExchange.TYPE.GOBOARD, ServerExchange.KEY.GOBOARD.RESET)));
	});
	$('body').on('click', 'input#switchbutton', function() {
		connection.send(JSON.stringify(ServerExchange.new(ServerExchange.TYPE.GOBOARD, ServerExchange.KEY.GOBOARD.SWITCH)));
	});
	$('body').on('click', 'input#leavebutton', function() {
		connection.send(JSON.stringify(ServerExchange.new(ServerExchange.TYPE.GOBOARD, ServerExchange.KEY.GOBOARD.LEAVE)));
	});

	
	connection = new WebSocket("ws://"+window.location.hostname+":"+Settings.socketPort)
	connection.onopen = function () {
		console.log("Connection opened");
		//ask who i am?
		var exc = ServerExchange.new(ServerExchange.TYPE.PLAYER, ServerExchange.KEY.PLAYER.SELF);
		connection.send(JSON.stringify(exc));
		exc = ServerExchange.new(ServerExchange.TYPE.PLAYER, ServerExchange.KEY.PLAYER.LIST);
		connection.send(JSON.stringify(exc));
		connected = true;
		updateUI();
	}
	connection.onclose = function () {
		console.log("Connection closed");
		connected = false;
		updateUI();
	}
	connection.onerror = function () {
		console.error("Connection error");
	}
	connection.onmessage = function (event) {
		var exc = ServerExchange.import(event.data);
		if(exc.type == ServerExchange.TYPE.GOBOARD) {
			ngb = exc.payload;
		} else if(exc.type == ServerExchange.TYPE.PLAYER) {
			if(exc.key == ServerExchange.KEY.PLAYER.SELF) {
				playerSelf = exc.payload;
			} else if(exc.key == ServerExchange.KEY.PLAYER.OPPONENT) {
				//playerOpponent = exc.payload;
			} else if(exc.key == ServerExchange.KEY.PLAYER.LIST) {
				playerList = exc.payload;
			}
		} else if(exc.type == ServerExchange.TYPE.COMMAND) {
			//we got word from the server that our command went through
		}
		updateUI();
	}

});
