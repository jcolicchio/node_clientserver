(function(exports){

	var Protocol = this['Protocol'];
	if(Protocol === undefined) {
		Protocol = require('../../server/Protocol.js');	
	}

	exports.new = function(id, name, pos, color) {
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
	exports.copy = function(p) {
		if(p === null) {
			return null;
		}
		return exports.new(p.id, p.name, p.pos, p.color);
	}
	exports.import = function(json) {
		return exports.copy(JSON.parse(json));
	}

	// **** Protocol Registration ****

	Protocol.register("Player", function(payload) {
		return exports.copy(payload);
	});

	Protocol.register("PlayerList", function(payload) {
		var list = [];
		for(key in payload) {
			list.push(exports.copy(payload[key]));
		}
		return list;
	});

})(typeof exports === 'undefined'? this['Player']={}: exports);