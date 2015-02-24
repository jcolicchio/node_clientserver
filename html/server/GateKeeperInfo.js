// This is the public information about the gatekeeper, such as how to connect to its websocket server
// Private settings regarding the GateKeeper can be found in GateKeeperSettings.js
(function(exports){
	exports.webPort = 8080; // TODO:? change this to 80 so it runs with sudo as default http
	exports.clientPort = 12345;

	//set this to wherever you want the server to expect to connect to the gatekeeper
	exports.hostname = "localhost";
})(typeof exports === 'undefined'? this['GateKeeperInfo']={}: exports);