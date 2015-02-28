// quick and dirty hack to set window's JsonFormatter if client
if(typeof exports === 'undefined') {
	this['JsonFormatter'] = JsonFormatter;
}

(function(exports) {

	var JsonFormatter;
	var isServer = (this['JsonFormatter'] === undefined);
	if(isServer) {
		var crypto = require('crypto');
		var node_cryptojs = require('node-cryptojs-aes');
		JsonFormatter = node_cryptojs.JsonFormatter;
		CryptoJS = node_cryptojs.CryptoJS;
		exports.randomBytes = function(n) { return crypto.randomBytes(n); };
	} else {
		JsonFormatter = this['JsonFormatter'];
	}

	exports.encrypt = function(payload, key) {
		return CryptoJS.AES.encrypt(payload, key, {format: JsonFormatter}).toString();
	}

	exports.decrypt = function(payload, key) {
		return CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(payload, key, {format: JsonFormatter}));
	}

})(typeof exports === 'undefined'? this['AES']={}: exports);
