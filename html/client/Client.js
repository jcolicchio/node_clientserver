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
	var serverStatus = $("<div id='serverstatus'></div>");
	$('body').append(serverStatus);

	setStatus("Connecting...");

	server = new WebSocket("ws://"+serverInfo.serverString());
	server.onopen = function () {
		console.log("Connection to server opened");

		disconnectFromGateKeeper();

		setStatus("Connected! ");
		// TODO: "disconnect" button
		$('#serverstatus').append("<input type='submit' id='disconnect' value='Disconnect' />");

		server.send(JSON.stringify(ServerExchange.new("hi", null)));
		
		server.connected = true;
	}
	server.onclose = function () {
		console.log("Connection closed");
		server.connected = false;

		// TODO: re-connect to gatekeeper
		$('#serverstatus').remove();

		connectToGateKeeper(connectToServer);
	}
	server.onerror = function () {
		console.error("Connection error");
	}
	server.onmessage = function (event) {
		console.log("game server said: "+event.data);
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

	// This is a connection to the GateKeeper
	// The argument is a callback for connecting to our own server, given one of our serverinfo objects
	connectToGateKeeper(connectToServer);

});
