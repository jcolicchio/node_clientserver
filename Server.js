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

// **** COMMAND LINE PROCESSING ****

var host = ServerSettings.defaultGateKeeper+":"+GateKeeperInfo.webPort;
var port = ServerSettings.defaultPort;
var name = ServerSettings.name;
var hasPassword = ServerSettings.hasPassword;
var password = ServerSettings.password;

for(var i=3;i<process.argv.length;i+=2) {
	var key = process.argv[i-1];
	var value = process.argv[i];
	if(key == "-n") {
		name = value;
	} else if(key == "-g") {
		host = value
	} else if(key == "-p") {
		port = value;
	} else if(key == "-s") {
		hasPassword = true;
		password = value;
	}
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
		name, 
		null, // the IP will be filled in on the other side where it's easily accessible
		port, 
		players.length, 
		ServerSettings.capacity, 
		hasPassword);

	console.log("about to send smart object with server: "+info.serverString());

	gateKeeper.emit("message", JSON.stringify(ServerExchange.new("ServerInfo", info)));
}

gateKeeper.connect();


// **** CLIENT INTERACTION ****
// This code handles the connection with clients who are playing a game/joining the server

var clientList = [];
var players = [];

var chatHistory = [];
var maxChatHistory = 5;

var clientSocket = ws.createServer({port:port}, function (connection) {
	// a new client has joined
	clientList.push(connection);

	// TODO: do we verify oauth before or after verifying the attempted connector has the right password?

	if(hasPassword) {
		connection.send(JSON.stringify(ServerExchange.new("password", null)));
	} else {

		// until we can verify his oauth identity and, optionally, he gets the password right
		clientSocket.addPlayer(connection);
	}

	connection.onmessage = function(event) {
		// TODO: try catch! User might try to break the server
		
		var exc = ServerExchange.import(event.data);

		if(exc.key == "message") {

			if(connection.authorized || !hasPassword) {
				chatHistory.push(event.data);
				clientSocket.broadcast(event.data);
			}

		} else if(exc.key == "password") {
			// make sure they got the right pw
			if(exc.payload == password) {
				// note this is repeated code, refactor this
				connection.authorized = true;
				clientSocket.addPlayer(connection);
			} else {
				//reject them! ask again or drop!
				connection.send(JSON.stringify(ServerExchange.new("password", null)));
			}
		}

	};

	connection.onclose = function() {
		//the client left the game server
		clientList.splice(clientList.indexOf(connection), 1);
		players.splice(players.indexOf(connection), 1);

		// remember to tell gatekeeper your stats changed
		gateKeeper.sendUpdatedInfo();
	};
});

//send a message to all clients in-game who have authenticated
clientSocket.broadcast = function(str) {
	for(key in players) {
		players[key].send(str);
	}
}

// add player, inform him of updates, etc
clientSocket.addPlayer = function(connection) {
	players.push(connection);
	gateKeeper.sendUpdatedInfo();
	for(key in chatHistory) {
		connection.send(chatHistory[key]);
	}
}
