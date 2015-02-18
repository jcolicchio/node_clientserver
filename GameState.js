(function(exports){
	var GameState = {};
	
	var Player = this['Player'];
	if(Player === undefined) {
		Player = require('./Player.js');
	}
	
	//the board should be a smart data structure, when you try to modify the data, it tells you if you can or not
	GameState.new = function() {
		var board = {
			players: [],
			timestamp: 0,
			update: function() {
				this.timestamp += 1;
				for(key in this.players) {
					this.players[key].update();
				}
			}
		}
	
		return board;
	}
	
	GameState.import = function(json) {
		var b = JSON.parse(json);
		return GameState.copy(b);
	}
	
	GameState.copy = function(b) {
		var board = GameState.new();
		board.timestamp = b.timestamp;
		for(key in b.players) {
			board.players.push(Player.copy(b.players[key]));
		}

		return board;
	}
	
	//exports.TEAM = GoBoard.TEAM;
	exports.new = GameState.new;
	exports.import = GameState.import;
	exports.copy = GameState.copy;
})(typeof exports === 'undefined'? this['GameState']={}: exports);
