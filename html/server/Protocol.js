// Generic class for sending smart objects with functions back and forth across websockets, etc
// use import to turn JSON into a protocol object, this will fully qualify the payload
// if the given key has been registered with a proper method for turning data into an object

// TODO: I've been thinking of standardizing Protocol keys
// camelCase for dumb data with no registration, simple JSON passthrough
// ClassCase for smart-objects or lists of smart objects, which need special registration

(function(exports) {

	// When you call new, it's expected that payload be a valid object, not JSON data
	exports.new = function(key, payload) {
		var protocol = {
			key: key,
			payload: payload
		};
		
		return protocol;
	};

	// When you call copy, payload can be either a real object or JSON data, it doesn't matter
	exports.copy = function(protocol) {
		var payload = protocol.payload;
		
		if(protocol.payload !== null && exports.types[protocol.key]) {
			protocol.payload = exports.types[protocol.key](protocol.payload);
		}
		return exports.new(protocol.key, protocol.payload);
	}

	// When you call import, you call it on JSON text
	// So payload is guaranteed just to be data
	exports.import = function(json) {
		var protocol = JSON.parse(json);
		return exports.copy(protocol);
	}

	// When you register a deserializer fn, it needs to take one arg
	// The arg you pass the fn is the payload
	// For example:
	// Protocol.register("Player", function(payload) { return Player.new(payload.id, payload.name); } );
	// It should return a qualified smart object based on the payload!
	exports.types = {};
	exports.register = function(key, fn) {
		exports.types[key] = fn;
	}
	
})(typeof exports === 'undefined'? this['Protocol']={}: exports);
