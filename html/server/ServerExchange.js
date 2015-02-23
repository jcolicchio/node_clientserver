(function(exports) {
	
	var ServerExchange = {};

	// When you call new, it's expected that payload be a valid object, not JSON data
	ServerExchange.new = function(key, payload) {
		var exc = {
			key: key,
			payload: payload
		};
		
		return exc;
	};

	// When you call copy, payload can be either a real object or JSON data, it doesn't matter
	ServerExchange.copy = function(exc) {
		var payload = exc.payload;
		
		if(exc.payload !== null && ServerExchange.types[exc.key]) {
			exc.payload = ServerExchange.types[exc.key](exc.payload);
		}
		return ServerExchange.new(exc.key, exc.payload);
	}

	// When you call import, you call it on JSON text
	// So payload is guaranteed just to be data
	ServerExchange.import = function(json) {
		var exc = JSON.parse(json);
		return ServerExchange.copy(exc);
	}

	// When you register a deserializer fn, it needs to take one arg
	// The arg you pass the fn is the payload
	// For example:
	// ServerExchange.register("Player", function(payload) { return Player.new(payload.id, payload.name); } );
	ServerExchange.types = {};
	ServerExchange.register = function(key, fn) {
		ServerExchange.types[key] = fn;
	}

	exports.new = ServerExchange.new;
	exports.copy = ServerExchange.copy;
	exports.import = ServerExchange.import;
	exports.types = ServerExchange.types;
	exports.register = ServerExchange.register;
	
})(typeof exports === 'undefined'? this['ServerExchange']={}: exports);
