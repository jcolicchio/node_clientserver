// Here's where we could design some kind of scheme for whitelisting stuff
// Here's also where we can put sensitive details like facebook app keys, 
// auth stuff we don't want users to have access to, etc
// Since only html is accessible from the web, these settings should chill outside

// Maybe this should just go at the top of GateKeeper? To the best of my knowledge it just gets used once

var LocalStorage = require('./storage/Local.js');
var LocalAuthenticator = require('./authentication/LocalAuthenticator.js');


// Presently, there's nothing here...
exports.ipWhiteList = null;
exports.ipBlackList = [];

exports.authenticator = LocalAuthenticator({
	userStore: LocalStorage({schema: ["id", "name", "email", "hash"]}), 
	tokenStore: LocalStorage({schema: ["id", "token"]})
});
