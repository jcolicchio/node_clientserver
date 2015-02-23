// This is the game server itself
// This will be customized for a given project
// But the way the server works, some of it will be standardized
// Find the template code here, along with examples of how to set up the server
// And to have it communicate with the players

// Keeping scalability in mind, theoretically any user should be able to spin one of these up
// However, if we want GateKeeper to only talk to legit servers that we control, we could
// Put some kind of whitelist of server IPs, such that GateKeeper won't list an unauthorized server unless its IP matches
// And furthermore, we could have some kind of config in some private GateKeeper setting


// For starters, we need to write the code that happens when this server boots up
// Check optional params for a port to run on, or default to 12345

// This is a game server, and so we'll need to import GateKeeperSettings.js
// And GateKeeperInfo.js
// It's suggested, but not necessary, that we add a ServerSettings,js file too

// we need ws for talking to clients
var ws = require('ws');

// we need io for server-to-server communication
var io = require('socket.io-client')

var ServerExchange = require('./html/server/ServerExchange.js');
var GateKeeperInfo = require('./html/server/GateKeeperInfo.js');
var ServerInfo = require('./html/server/ServerInfo.js');
var ServerSettings = require('./ServerSettings.js');


var players = [];
console.log("server going up! connecting to gate keeper at localhost:"+GateKeeperInfo.webPort);
//for now, we're just connecting to localhost, joecolicch.io
gateKeeperConnection = io.connect('http://localhost:'+GateKeeperInfo.webPort);
gateKeeperConnection.on('connect', function () {
	console.log("Connection opened");
});

gateKeeperConnection.on('disconnect', function () {
	console.log("Connection closed");
	// connection to the server went down
	// TODO: alert current players, and try to re-connect?
});

//gateKeeperConnection.onerror = function () {
//	console.error("Connection error");
//}

gateKeeperConnection.on('message', function (event) {

	console.log("gatekeeper speaks!: "+event);
	var exc = ServerExchange.import(event);

	if(exc.key == "ServerInfo") {
		//we need to send our info
		var info = ServerInfo.new(
			ServerSettings.name, 
			null, 
			ServerSettings.port, 
			players.length, 
			ServerSettings.capacity, 
			ServerSettings.hasPassword);

		console.log("sending!");
		gateKeeperConnection.emit("message", JSON.stringify(ServerExchange.new("ServerInfo", info)));
		console.log("sent!");
	}
});

gateKeeperConnection.connect();

//let's also kick off the player's websocket thinger!
// TODO! let people actually connect!