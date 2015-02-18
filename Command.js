(function(exports){
	Command = {};
	
	var Player = this['Player'];
	
	if(Player === undefined) {
		Player = require('./Player.js');
	}
	
	Command.new = function(player, x, y) {
		var cmd = {
			player: player,
			x: x,
			y: y,
			equal: function(cmd) {
				if(cmd === undefined || cmd === null) {
					return false;
				}
				return (this.x == cmd.x && this.y == cmd.y && this.player.equal(cmd.player));
			}
		};
		return cmd;
	};
	
	Command.import = function(json) {
		var cmd = JSON.parse(json);
		return Command.copy(cmd);
	};
	
	Command.copy = function(c) {
		if(c === undefined || c === null) {
			return c;
		}
		return Command.new(Player.copy(c.player), c.x, c.y);
	};
	
	exports.new = Command.new;
	exports.import = Command.import;
	exports.copy = Command.copy;
})(typeof exports === 'undefined'? this['Command']={}: exports);
