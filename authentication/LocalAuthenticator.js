var User = require('../html/server/User.js');
var Authenticator = require('./Authenticator.js');

module.exports = function(config) {
	var auth = Authenticator.new(config);

	auth.idForToken = function(token) {
		var tokenRows = auth.tokenStore.find({token: token}, 1);
		if(tokenRows.length == 1) {
			return tokenRows[0].row.id;
		}
		return false;
	}
	auth.userForId = function(id) {
		var userRows = auth.userStore.find({id:id}, 1);
		if(userRows.length == 1) {
			return userRows[0].row;
		}
		return false;
	}

	auth.isValidToken = function(token) {
		return (auth.tokenStore.find({token: token}, 1).length > 0);
	}
	auth.getUserForToken = function(token) {
		var id = this.idForToken(token);
		if(id !== false) {
			var user = this.userForId(id);
			if(user !== false) {
				return User.copy(user);
			}
		}
		return false;
	}
	auth.updateUser = function(token, user) {
		var id = this.idForToken(token);
		if(id !== false && id === user.id) {
			var currentUser = this.userForId(id);
			if(currentUser !== false) {
				// make sure the email is unique if it's new
				if(currentUser.email != user.email) {
					var existingEmailRows = auth.userStore.find({email: user.email}, 1);
					if(existingEmailRows.length == 1) {
						return false;
					}
				}
				// make sure they didnt change the id
				if(currentUser.id == user.id) {
					var updated = auth.userStore.update({id: user.id}, {id:user.id, name:user.name, email:user.email}, 1);
					if(updated.length == 1) {
						return true;
					}
				}
			}
		}
		return false;
	}
	auth.logoutUser = function(token) {
		if(this.idForToken(token) !== false) {
			var rows = auth.tokenStore.remove({token: token}, 1);
			if(rows.length == 1) {
				return true;
			}
		}
		return false;
	}

	auth.updatePassword = function(token, currentHash, newHash) {
		var id = this.idForToken(token);
		if(id !== false) {
			var user = this.userForId(id);
			if(user !== false) {
				if(user.hash == currentHash) {
					var updatedRows = auth.userStore.update(user, {hash: newHash}, 1);
					if(updatedRows.length == 1) {
						return true;
					}
				}
			}
		}
		return false;
	}

	var newAuthToken = function(){ return Date.now()+15*60*1000; };

	auth.registerUser = function(email, hash) {
		var matchingUsers = auth.userStore.find({email: email}, 1);
		if(matchingUsers.length == 0) {
			var id = auth.userStore.index;
			if(auth.userStore.insert({id:id, email:email, hash: hash})) {
				// go ahead and authenticate
				var token = newAuthToken();
				if(auth.tokenStore.insert({id:id, token:token})) {
					return token;
				}
			}
		}
		return false;
	}

	auth.loginUser = function(email, hash) {
		var matchingUsers = auth.userStore.find({email:email, hash:hash}, 1);
		if(matchingUsers.length == 1) {
			var token = newAuthToken();
			var id = matchingUsers[0].row.id;
			var existingTokenRows = auth.tokenStore.find({id:id}, 1);
			if(existingTokenRows.length == 1) {
				auth.tokenStore.remove({id:id},1);
			}
			if(auth.tokenStore.insert({id:id, token: token})) {
				return token;
			}
		}
		return false;
	}

	return auth;
}