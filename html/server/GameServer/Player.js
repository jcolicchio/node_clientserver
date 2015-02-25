(function(exports){

	var ServerExchange = this['ServerExchange'];
	if(ServerExchange === undefined) {
		ServerExchange = require('../ServerExchange.js');	
	}

	Player = {};
	Player.new = function(id, name, pos, color) {
		var player = {
			id: id,
			name: name,
			pos: pos,
			color: color,
			equal: function(player) {
				return this.id == player.id && this.name == player.name;
			}
		}

		return player;
	}
	Player.copy = function(p) {
		if(p === null) {
			return null;
		}
		return Player.new(p.id, p.name, p.pos, p.color);
	}
	Player.import = function(json) {
		return Player.copy(JSON.parse(json));
	}
	
	exports.new = Player.new;
	exports.copy = Player.copy;
	exports.import = Player.import;


	// **** ServerExchange Registration ****

	ServerExchange.register("Player", function(payload) {
		return Player.copy(payload);
	});

	ServerExchange.register("PlayerList", function(payload) {
		var list = [];
		for(key in payload) {
			list.push(Player.copy(payload[key]));
		}
		return list;
	});

})(typeof exports === 'undefined'? this['Player']={}: exports);