(function(exports){
	var NetworkedGoBoard = {};

	var GoBoard = this['GoBoard'];	
	if(GoBoard === undefined) {
		GoBoard = require('./GoBoard.js');
	}
	var Player = this['Player'];
	if(Player === undefined) {
		Player = require('./Player.js');
	}
	
	NetworkedGoBoard.new = function(whitePlayer, blackPlayer, board, players) {
		var server = {
			whitePlayer: whitePlayer,
			blackPlayer: blackPlayer,
			board: board,
			players: players,
			applyCommand: function(cmd) {
				if(cmd.player.equal(this.whitePlayer)) {
					return board.placePiece(GoBoard.TEAM.WHITE, cmd.x, cmd.y);
				} else if(cmd.player.equal(this.blackPlayer)) {
					return board.placePiece(GoBoard.TEAM.BLACK, cmd.x, cmd.y);
				} else {
					console.log("not an active player:");
					console.log(cmd.player);
					console.log(this.whitePlayer);
					console.log(this.blackPlayer);
					return false;
				}
			},
			active: function() {
				return (this.whitePlayer !== null && this.blackPlayer !== null);
			}
		};
	
		return server;
	};
	NetworkedGoBoard.copy = function(ngb) {
		var newList = [];
		for(key in ngb.players) {
			newList.push(Player.copy(ngb.players[key]));
		}
		return NetworkedGoBoard.new(Player.copy(ngb.whitePlayer), Player.copy(ngb.blackPlayer), GoBoard.copy(ngb.board), newList);
	}
	NetworkedGoBoard.import = function(json) {
		return NetworkedGoBoard.copy(JSON.parse(json));
	}
	
	exports.new = NetworkedGoBoard.new;
	exports.copy = NetworkedGoBoard.copy;
	exports.import = NetworkedGoBoard.import;

})(typeof exports === 'undefined'? this['NetworkedGoBoard']={}: exports);
