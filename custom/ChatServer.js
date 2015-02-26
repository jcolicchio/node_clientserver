// TODO: consider moving "Type" to the first arg?
// TODO: consider an object with keys as a single argument

// require Server.js with default name, Chat type, default other properties
var Server = require('../Server.js')(null, "Chat");

// Player is the object being sent back and forth
var Player = require('../html/custom/chat/Player.js');

// iterate playerId as new players are created
// i suppose this could go in the Player class/constructor?
var playerId = 0;

// maintain a chat history:
// {name: who sent it, message: the message text}
var chatHistory = [];

// maintain a list of most recent 10 messages
var chatHistoryLength = 10;

var pushChatHistory = function(entry) {
	// push an arbitrary entry to the chat history, and remove oldest ones from queue if need be
	chatHistory.push(entry);
	if(chatHistory.length > chatHistoryLength) {
		chatHistory.splice(0, chatHistory.length - chatHistoryLength);
	}
}

Server.onConnect = function(client) {
	// this callback occurs when the server verifies the client is legit
	// tell the client they authenticated successfully
	Server.send(client, "joined", null);

	// create a new player, assign it to the client
	// this will last for the duration of the connection
	var player = Player.new(++playerId, "Anon"+playerId);
	client.player = player;

	// send the new client the chat history
	for(key in chatHistory) {
		Server.send(client, "message", chatHistory[key].name+": "+chatHistory[key].message);
	}

	// tell everyone the new client has joined
	Server.broadcast("message", "Server: "+player.name+" has joined!");

	// push the join to the chat history
	pushChatHistory({name: "Server", message: player.name+" has joined!"});

	// send an off-the-record PM to new player, thanking him for joining
	Server.send(client, "message", "<i>&lt;Server: Thanks for joining!&gt;</i>");

	// send the client his "self" player identity
	Server.send(client, "Player", player);

	// update everyone on the fresh list of players connected
	var list = [];
	for(key in Server.clients) {
		list.push(Server.clients[key].player);
	}
	Server.broadcast("PlayerList", list);
}

Server.onDisconnect = function(client) {
	var player = client.player;
	// when the client leaves, tell everyone they left
	Server.broadcast("message", "Server: "+player.name+" has left!");

	// push the leave message to the chat
	pushChatHistory({name: "Server", message: player.name+" has left!"});

	// update everyone with a fresh player list
	var list = [];
	for(key in Server.clients) {
		list.push(Server.clients[key].player);
	}
	Server.broadcast("PlayerList", list);
}

Server.onMessage = function(client, key, payload) {
	// if the client sent a message:
	if(key == "message") {
		// push it to history
		pushChatHistory({name: client.player.name, message: payload});
		// broadcast it to everyone
		Server.broadcast("message", client.player.name+": "+payload);
	} else if(key == "Player" && client.player.id == payload.id) {
		// if the client sent a Player whose id matches theirs
		client.player.name = payload.name;
		// go ahead and update the client's player name

		// let everyone know the new list with newly updated player name
		var list = [];
		for(key in Server.clients) {
			list.push(Server.clients[key].player);
		}
		Server.broadcast("PlayerList", list);
	}
}

Server.onError = function(client, error) {
	// just log it lol
	console.log("error! "+error);
}

Server.connect();