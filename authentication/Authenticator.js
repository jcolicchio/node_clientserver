var User = require('../html/server/User.js');

exports.new = function(config) {

	// do something with config

	if(!config.userStore) {
		config.userStore = null;
	}
	if(!config.tokenStore) {
		config.tokenStore = null;
	}

	return {
		//
		userStore: config.userStore,
		//
		tokenStore: config.tokenStore,

		// token-related methods
		isValidToken: function(token) {
			// return true or false if token invalid
			return true;
		},
		getUserForToken: function(token) {
			// return a user or null if invalid
			return User.new(null, null, null);
		},
		updateUser: function(token, user) {
			// return true or false if invalid or problem
			return true;
		},
		logoutUser: function(token) {
			// return true or false if token invalid
			return true;
		},

		// logged in, but requires current hash?
		updatePassword: function(token, currentHash, newHash) {
			// return true or false if invalid or problem
			return true;
		},

		// things you can do without being logged in
		registerUser: function(email, hash) {
			// register user and return token or false if problem
			return 1;
		},
		loginUser: function(email, hash) {
			// return token or false if problem
			return 1;
		}
	};
};

