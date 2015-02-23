// we see a lot of these four lines. theoretically we should probably say
// if this['whatever'] doesn't exist, set it to require
// could that work? i have no idea what node server's context is like
// if we set this['module'] if not already defined, will other parts see any changes we make to the singleton?

// this is probably why it's not meant to be singleton-ish

var GateKeeperInfo = this['GateKeeperInfo'];
if(GateKeeperInfo === undefined) {
	GateKeeperInfo = require('../server/GateKeeperInfo.js');
}

var ServerInfo = this['ServerInfo'];
if(ServerInfo === undefined) {
	ServerInfo = require('../server/ServerInfo.js');
}

var ServerExchange = this['ServerExchange'];
if(ServerExchange === undefined) {
	ServerExchange = require('../server/ServerExchange.js');
}

var gateKeeperConnection;

var connected = false;

$(document).ready(function(){

	// This is a connection to the GateKeeper
	// This stuff is probably pretty generalizable, I don't think it necessarily belongs with the custom client stuff
	// Could we split stuff up into GateKeeperClient.js and Client.js?

	gateKeeperConnection = new WebSocket("ws://"+window.location.hostname+":"+GateKeeperInfo.clientPort)
	gateKeeperConnection.onopen = function () {
		console.log("Connection opened");
		
		connected = true;
	}
	gateKeeperConnection.onclose = function () {
		console.log("Connection closed");
		connected = false;
	}
	gateKeeperConnection.onerror = function () {
		console.error("Connection error");
	}
	gateKeeperConnection.onmessage = function (event) {

		var exc = ServerExchange.import(event.data);
		// theoretically, it should just work for us
		// by virtue of importing GateKeeperInfo, the registration should be done

		//if the key is ServerList, expect a list of ServerInfo objects
		console.log("just got the list!");
		console.log(exc.payload);

	}

});
