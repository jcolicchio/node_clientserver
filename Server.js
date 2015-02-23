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
// Check optional params for a port to run on, or default to whatever's in settings

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

//TODO: fix up command line args

// -n name
// -s secret
// -p port
// -g gatekeeper with optional :8080 or so


// **** COMMAND LINE PROCESSING ****

var host = GateKeeperInfo.hostname+":"+GateKeeperInfo.webPort;
var port = ServerSettings.defaultPort;

if(process.argv.length > 2) {
	// if it has a ., it's an IP
	var firstArg = process.argv[2];
	if(firstArg.indexOf(".") >= 0) {
		host = firstArg;
		if(host.indexOf(":") < 0) {
			host += ":"+GateKeeperInfo.webPort;
		}
	} else {
		// could either be port or password, assume port for now
		port = firstArg;
	}
}
if(process.argv.length > 3) {
	var secondArg = process.argv[3];
	port = secondArg;
}


// **** GATEKEEPER INTERACTION ****

//connect to the gatekeeper
gateKeeper = io.connect('http://'+host);
gateKeeper.on('connect', function () {
	// as a server, when we connect to gatekeeper, we should inform him of our info
	// he'll ask anyway though, so let's leave this for now
});

gateKeeper.on('disconnect', function () {
	// connection to the server went down
	// TODO: alert current players, and try to re-connect?

});


gateKeeper.on('message', function (event) {

	var exc = ServerExchange.import(event);

	if(exc.key == "ServerInfo") {
		
		gateKeeper.sendUpdatedInfo();

	} else {
		console.log("unknown message type: "+exc.key+" sent to server from gatekeeper, with payload: "+JSON.stringify(exc.payload));
	}
});
gateKeeper.sendUpdatedInfo = function() {
	var info = ServerInfo.new(
		ServerSettings.name, 
		null, // the IP will be filled in on the other side where it's easily accessible
		port, 
		players.length, 
		ServerSettings.capacity, 
		ServerSettings.hasPassword);

	console.log("about to send smart object with server: "+info.serverString());

	gateKeeper.emit("message", JSON.stringify(ServerExchange.new("ServerInfo", info)));
}

gateKeeper.connect();


// **** CLIENT INTERACTION ****
// This code handles the connection with clients who are playing a game/joining the server

var clientList = [];
var players = [];

var clientSocket = ws.createServer({port:port}, function (connection) {
	// a new client has joined
	clientList.push(connection);

	// TODO: don't do this immediately...
	// on connect, add a connection, but don't necessarily add a "player"
	// until we can verify his oauth identity and, optionally, he gets the password right
	players.push(connection);


	// one thing that we'll have to do if we implement oauth, is ask the client for his oauth token
	// if he provides it, we need to double-check with gatekeeper to verify the client's identity
	// this is the mechanic we'll use for identity validation in server games

	// remember there may be a password set in the future, so if there is, we need to ask the user
	// and if he returns the wrong password, don't even update the server
	gateKeeper.sendUpdatedInfo();

	// we should ask him for a password if this server uses passwords
	// and if he doesn't respond with the right password in time, kick him

	connection.onmessage = function(event) {
		var exc = ServerExchange.import(event.data);

		// for now just parrot it back
		connection.send(event.data);
	};

	connection.onclose = function() {
		//the client left the game server
		clientList.splice(clientList.indexOf(connection), 1);
		players.splice(players.indexOf(connection), 1);

		// remember to tell gatekeeper your stats changed
		gateKeeper.sendUpdatedInfo();
	};
});

//send a message to all clients in-game
clientSocket.broadcast = function(str) {
	for(key in clientList) {
		clientList[key].send(str);
	}
}
