// This is the client, should be pretty much custom code here

var ServerExchange = this['ServerExchange'];
if(ServerExchange === undefined) {
	ServerExchange = require('../server/ServerExchange.js');
}
var ServerInfo = this['ServerInfo'];
if(ServerInfo === undefined) {
	ServerInfo = require('../server/ServerInfo.js');
}

var server;

// custom stuff specific to our game server itself
// note: we'll receive a ServerInfo object from GateKeeperClient.js
var connectToServer = function(serverInfo) {

	// UI for "connecting...";
	var clientContent = $("<div id='clientcontent'></div>");
	$('body').append(clientContent);

	var serverStatus = $("<div id='serverstatus'></div>");
	clientContent.append(serverStatus).append("<br/>");

	clientContent.append("<div id='chat'></div><br/>");
	clientContent.append("<input type='text' id='message' /><input type='submit' id='send' value='Send' />");

	setStatus("Connecting...");

	server = new WebSocket("ws://"+serverInfo.serverString());
	server.onopen = function () {
		console.log("Connection to server opened");

		disconnectFromGateKeeper();

		setStatus("Connected! ");
		// TODO: "disconnect" button
		$('#serverstatus').append("<input type='submit' id='disconnect' value='Disconnect' />");
		
		server.connected = true;
	}
	server.onclose = function () {
		console.log("Connection closed");
		server.connected = false;

		$('#clientcontent').remove();

		// we disconnected from game, connect to GK again!
		connectToGateKeeper(connectToServer);
	}
	server.onerror = function () {
		console.error("Connection error");
	}
	server.onmessage = function (event) {
		var exc = ServerExchange.import(event.data);

		if(exc.key == "message") {
			console.log("game server said: "+exc.payload);
			$('#chat').append(exc.payload+"<br/>");
		} else if(exc.key == "password") {
			// the server has a password
			console.log("whats the password");
			var pw = prompt("Password?");
			server.send(JSON.stringify(ServerExchange.new("password", pw)));
		}
	}
}

// UI stuff?
var setStatus = function(status) {
	$('#serverstatus').empty().append(status);
}

//jquery stuff for setting up the page, most of this code is
$(document).ready(function(){

	$('body').on('click', '#disconnect', function(e) {
		server.close();
	});

	$('body').on('click', '#send', function(e) {
		server.send(JSON.stringify(ServerExchange.new("message", $('#message').val())));
		$('#message').val("");
	});

	// This is a connection to the GateKeeper
	// The argument is a callback for connecting to our own server, given one of our serverinfo objects
	connectToGateKeeper(connectToServer);

});
