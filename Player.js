(function(exports){
	var Player = {};
	
	Player.new = function(id, name/*, connection*/) {
		var player = {
			id: id,
			name: name,
			//connection: connection,
			equal: function(player) {
				if(player === undefined || player === null) {
					return false;
				}
				return (this.id == player.id && this.name == player.name /*&& this.connection == player.connection*/);
			}
		};
		return player;
	};
	
	Player.import = function(json) {
		var p = JSON.parse(json);
		return Player.copy(p);
	};
	
	Player.copy = function(p) {
		if(p === undefined || p === null) {
			return p;
		}
		var p = Player.new(p.id, p.name/*, p.connection*/);
		return p;
	};
	
	exports.new = Player.new;
	exports.import = Player.import;
	exports.copy = Player.copy;
})(typeof exports === 'undefined'? this['Player']={}: exports);
