(function(exports){

	var ServerExchange = this['ServerExchange'];
	if(ServerExchange === undefined) {
		ServerExchange = require('../../server/ServerExchange.js');	
	}

	Command = {};
	Command.new = function(source, dest, endTurn, result) {
		var command = {
			source: source,
			dest: dest,
			endTurn: endTurn,
			result: result
		}

		return command;
	}
	Command.copy = function(c) {
		if(!c) {
			return null;
		}
		return Command.new(c.source, c.dest, c.endTurn, c.result);
	}
	Command.import = function(json) {
		return Command.copy(JSON.parse(json));
	}
	
	exports.new = Command.new;
	exports.copy = Command.copy;
	exports.import = Command.import;


	// **** ServerExchange Registration ****

	ServerExchange.register("Command", function(payload) {
		return Command.copy(payload);
	});

})(typeof exports === 'undefined'? this['Command']={}: exports);