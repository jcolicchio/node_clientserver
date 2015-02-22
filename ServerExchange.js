(function(exports) {
	
	var GoBoard = this['GoBoard'];
	if(GoBoard === undefined) {
		GoBoard = require('./GoBoard.js');
	}
	var Command = this['Command'];
	if(Command === undefined) {
		Command = require('./Command.js');
	}
	var Player = this['Player'];
	if(Player === undefined) {
		Player = require('./Player.js');
	}
	var NetworkedGoBoard = this['NetworkedGoBoard'];
	if(NetworkedGoBoard === undefined) {
		NetworkedGoBoard = require('./NetworkedGoBoard.js');
	}
	
	var ServerExchange = {};

    //TODO(sitem): Clean this up. Maybe seal and freeze since we're using them as enums.
	ServerExchange.TYPE = {};
	ServerExchange.TYPE.VALUE = 0;
	ServerExchange.TYPE.GOBOARD= 1;
	ServerExchange.TYPE.COMMAND = 2;
	ServerExchange.TYPE.PLAYER = 3;

	ServerExchange.KEY = {};
	ServerExchange.KEY.PLAYER = {};
	ServerExchange.KEY.PLAYER.SELF = 0;
	ServerExchange.KEY.PLAYER.OPPONENT = 1;
	ServerExchange.KEY.PLAYER.LIST = 2;
	ServerExchange.KEY.GOBOARD = {};
	ServerExchange.KEY.GOBOARD.STATE = 3;
	ServerExchange.KEY.GOBOARD.SWITCH = 4;
	ServerExchange.KEY.GOBOARD.RESET = 5;
	ServerExchange.KEY.GOBOARD.LEAVE = 6;
	ServerExchange.KEY.COMMAND = {};
	ServerExchange.KEY.COMMAND.REQUEST = 7;
	ServerExchange.KEY.COMMAND.RESPONSE = 8;

	ServerExchange.new = function(type, key, payload) {
		var exc = {
			type: type,
			key: key,
			payload: payload
		};
		
		return exc;
	};
    //TODO(sitem): We need to create some sort of way to register things
    //             such as a NetworkedGoBoard or a Player. We should not
    //             have things that specific here.
	ServerExchange.copy = function(exc) {
		var payload = exc.payload;
		if(payload !== undefined && payload !== null) {
			if(exc.type == ServerExchange.TYPE.GOBOARD) {
				console.log("about to copy");
				payload = NetworkedGoBoard.copy(exc.payload);
				console.log(payload);
			} else if(exc.type == ServerExchange.TYPE.COMMAND && exc.key == ServerExchange.KEY.COMMAND.REQUEST) {
				payload = Command.copy(exc.payload);
			} else if(exc.type == ServerExchange.TYPE.PLAYER) {
				if(exc.key == ServerExchange.KEY.PLAYER.LIST) {
					//assume the payload is a list of player objects
					var newList = [];
					for(key in exc.payload) {
						newList.push(Player.copy(exc.payload[key]));
					}
					payload = newList;
				} else {
					payload = Player.copy(exc.payload);
				}
			}
		}
		return ServerExchange.new(exc.type, exc.key, payload);
	}
	ServerExchange.import = function(json) {
		var exc = JSON.parse(json);
		return ServerExchange.copy(exc);
	}
	
	exports.TYPE = ServerExchange.TYPE;
	exports.KEY = ServerExchange.KEY;
	exports.new = ServerExchange.new;
	exports.copy = ServerExchange.copy;
	exports.import = ServerExchange.import;
	
})(typeof exports === 'undefined'? this['ServerExchange']={}: exports);
