(function(exports) {
	
	var GameState = this['GameState'];
	if(GameState === undefined) {
		GameState = require('./GameState.js');
	}
	var Input = this['Input'];
	if(Input === undefined) {
		Input = require('./Input.js');
	}
	var Player = this['Player'];
	if(Player === undefined) {
		Player = require('./Player.js');
	}
	
	/*var NetworkedGoBoard = this['NetworkedGoBoard'];
	if(NetworkedGoBoard === undefined) {
		NetworkedGoBoard = require('./NetworkedGoBoard.js');
	}*/
	
	var ServerExchange = {};

	ServerExchange.TYPE = {};
	ServerExchange.TYPE.VALUE = 0;
	ServerExchange.TYPE.GAMESTATE= 1;
	ServerExchange.TYPE.INPUT = 2;
	ServerExchange.TYPE.PLAYER = 3;

	ServerExchange.KEY = {};
	ServerExchange.KEY.PLAYER = {};
	ServerExchange.KEY.PLAYER.SELF = 0;
	//ServerExchange.KEY.PLAYER.OPPONENT = 1;
	//ServerExchange.KEY.PLAYER.LIST = 2;
	ServerExchange.KEY.GAMESTATE = {};
	ServerExchange.KEY.GAMESTATE.STATE = 3;
	//ServerExchange.KEY.GAMESTATE.SWITCH = 4;
	//ServerExchange.KEY.GAMESTATE.RESET = 5;
	//ServerExchange.KEY.GAMESTATE.LEAVE = 6;
	ServerExchange.KEY.INPUT = {};
	ServerExchange.KEY.INPUT.REQUEST = 7;
	ServerExchange.KEY.INPUT.RESPONSE = 8;

	ServerExchange.new = function(type, key, payload) {
		var exc = {
			type: type,
			key: key,
			payload: payload
		};
		
		return exc;
	};
	ServerExchange.copy = function(exc) {
		var payload = exc.payload;
		if(payload !== undefined && payload !== null) {
			if(exc.type == ServerExchange.TYPE.GAMESTATE) {
				//console.log("about to copy");
				payload = GameState.copy(exc.payload); //NetworkedGoBoard.copy(exc.payload);
				//console.log(payload);
			} else if(exc.type == ServerExchange.TYPE.INPUT && exc.key == ServerExchange.KEY.INPUT.REQUEST) {
				payload = Input.copy(exc.payload);

			} else if(exc.type == ServerExchange.TYPE.PLAYER) {
				/*if(exc.key == ServerExchange.KEY.PLAYER.LIST) {
					//assume the payload is a list of player objects
					var newList = [];
					for(key in exc.payload) {
						newList.push(Player.copy(exc.payload[key]));
					}
					payload = newList;
				} else {*/
					payload = Player.copy(exc.payload);
				//}
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
