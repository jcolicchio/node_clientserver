(function(exports) {

	exports.new = function(id, name, email) {
		return {
			id: id,
			name: name,
			email: email
		}
	}

	exports.copy = function(user) {
		return exports.new(user.id, user.name, user.email);
	}

	exports.import = function(json) {
		return exports.copy(JSON.parse(json));
	}

	var Protocol = this['Protocol'];
	if(Protocol === undefined) {
		Protocol = require('./Protocol.js');	
	}

	Protocol.register("User", function(payload) {
		return exports.copy(payload);
	}); 

})(typeof exports === 'undefined' ? this['User']={}:exports);