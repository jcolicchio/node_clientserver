// This is the public information about the gatekeeper, such as how to connect to its websocket server
// Private settings regarding the GateKeeper can be found in GateKeeperSettings.js
(function(exports){
	exports.webPort = 8080; // TODO: change this to 80 so it runs with sudo as default http 
	exports.clientPort = 12345;
	
	// get rid of server port, we use 8080 or whatever web port to allow 
	exports.serverPort = 12346;

	//set this to wherever you want the server to expect to connect to the gatekeeper
	exports.hostname = "joecolicch.io";
})(typeof exports === 'undefined'? this['GateKeeperInfo']={}: exports);

// Keep in mind, this is where we'd originally planned to have:
// GateKeeper-related smart object class registration with ServerExchange

var ServerExchange = this['ServerExchange'];
if(ServerExchange === undefined) {
	ServerExchange = require('../server/ServerExchange.js');
}

// This part registers ServerExchange with the "ServerList" key
// This means the server can now send the client a "ServerList" message
// In practice, we'll probably kick off a broadcast when a server comes up or down
// And allow the user to "refresh" by sending a "ServerList" exchange with a null payload
ServerExchange.register("ServerList", function(payload) {
	//we're assuming payload is a list of server thingers
	var serverList = [];
	for(key in payload) {
		console.log("deserializing: ");
		console.log(payload[key]);
		serverList[key] = ServerInfo.copy(payload[key]);
	}
	return serverList;
});

ServerExchange.register("ServerInfo", function(payload) {
	return ServerInfo.copy(payload);
});