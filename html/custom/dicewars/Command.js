(function(exports){

	var Protocol = this['Protocol'];
	if(Protocol === undefined) {
		Protocol = require('../../server/Protocol.js');	
	}

	exports.new = function(source, dest, endTurn, result) {
		var command = {
			source: source,
			dest: dest,
			endTurn: endTurn,
			result: result
		}

		return command;
	}
	exports.copy = function(c) {
		if(!c) {
			return null;
		}
		return exports.new(c.source, c.dest, c.endTurn, c.result);
	}
	exports.import = function(json) {
		return exports.copy(JSON.parse(json));
	}

	// **** Protocol Registration ****

	Protocol.register("Command", function(payload) {
		return exports.copy(payload);
	});

})(typeof exports === 'undefined'? this['Command']={}: exports);