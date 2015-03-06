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
		},
		getUserForToken: function(token) {
			// return a user or null if invalid
		},
		updateUser: function(token, user) {
			// return true or false if invalid or problem
		},
		logoutUser: function(token) {
			// return true or false if token invalid
		},

		// logged in, but requires current hash?
		updatePassword: function(token, currentHash, newHash) {
			// return true or false if invalid or problem
		},

		// things you can do without being logged in
		registerUser: function(email, hash) {
			// register user and return token or false if problem
		},
		loginUser: function(email, hash) {
			// return token or invalid if problem
		}
	};
};

