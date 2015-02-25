var Server = require('../Server.js')();

var Player = require('../html/server/GameServer/Player.js');

var players = [];
var playerId = 0;

var chatHistory = [];
var chatHistoryLength = 10;

var pushChatHistory = function(entry) {
	chatHistory.push(entry);
	if(chatHistory.length > chatHistoryLength) {
		chatHistory.splice(0, chatHistory.length - chatHistoryLength);
	}
}

Server.onConnect = function(client) {
	Server.send(client, "joined", null);

	var player = Player.new(++playerId, "Anon"+playerId);
	client.player = player;
	for(key in chatHistory) {
		Server.send(client, "message", chatHistory[key].name+": "+chatHistory[key].message);
	}
	Server.broadcast("message", "Server: "+player.name+" has joined!");
	pushChatHistory({name: "Server", message: player.name+" has joined!"});
	Server.send(client, "message", "<i>&lt;Server: Thanks for joining!&gt;</i>");
	Server.send(client, "Player", player);

	var list = [];
	for(key in Server.clients) {
		list.push(Server.clients[key].player);
	}
	Server.broadcast("PlayerList", list);
}

Server.onDisconnect = function(client) {
	var player = client.player;
	Server.broadcast("message", "Server: "+player.name+" has left!");
	pushChatHistory({name: "Server", message: player.name+" has left!"});

	var list = [];
	for(key in Server.clients) {
		list.push(Server.clients[key].player);
	}
	Server.broadcast("PlayerList", list);
}

Server.onMessage = function(client, key, payload) {
	if(key == "message") {
		pushChatHistory({name: client.player.name, message: payload});
		Server.broadcast("message", client.player.name+": "+payload);
	} else if(key == "Player") {
		client.player.name = payload.name;
	}
}

Server.onError = function(client, error) {
	console.log("error! "+error);
}