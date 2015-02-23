// This file is pretty much boilerplate, users should ideally never need to tweak it

// This file contains code for connecting to gatekeeper
// When you ask to connect, you pass it a method to call with the approriate server info
// for when you want to connect to a game server
// Presently, it passes in a ServerInfo object

// TODO: have GK disconnect players when they successfully auth to the server
// rather than have GKClient disconnect players when they successfully connect to a server
// They don't need to be connected to the GK, as far as i can tell,
// If they've joined a game. So I think when you click join, it should wipe the UI element, disconnect you
// And then if the player gets disconnected, they can call connect() again

var gateKeeper;
var connectionFunction = null;

$(document).ready(function() {

	$('body').on('click', '.refresh', function(e){
		//ask the gatekeeper connection to refresh
		gateKeeper.send(JSON.stringify(ServerExchange.new("ServerList", null)));
	});

	$('body').on('click', '.join', function(e){
		// e is what we clicked on i guess?
		var server = $(this).data("ip")+":"+$(this).data("port");
		//make connection connect to it!
		gateKeeper.connectionFunction($(this).data("info"));
		
		// disconnect from gatekeeper?
		// maybe once the user connects to server...
		// TODO: when a user connects to server, have server tell GK to disconnect them
		// this would of course happen once the server is done verifying with GK that the player is legit
		// either way, politely leave client-side, but force a disconnect serverside?
		// is there even a point to that? they could just connect again?
		// then let's say, if they connect again and auth, drop them from all clients they may be connected to?
		// this is a future:oauth problem
	});
});

var connectToGateKeeper = function(connectionFunction){

	// TODO: do these belong inside or outside the function?
	// shouldn't hurt to have them global-ish, should it? do they belong there?
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


	gateKeeper = new WebSocket("ws://"+window.location.hostname+":"+GateKeeperInfo.clientPort);
	gateKeeper.onopen = function () {
		console.log("Connection opened");
		
		gateKeeper.connected = true;
	}
	gateKeeper.onclose = function () {
		console.log("Connection closed");
		gateKeeper.connected = false;

		//gateKeeper = null;
		$('#serverlist').remove();
	}
	gateKeeper.onerror = function () {
		console.error("Connection error");
	}
	gateKeeper.onmessage = function (event) {

		// since GateKeeperInfo registered the proper classes for communicating with gatekeeper,
		// this call to import will produce a proper list of ServerInfo smart objects
		// or a proper ServerInfo smart object, or whatever else we told it to be able to re-initialize
		var exc = ServerExchange.import(event.data);

		//if the key is ServerList, expect a list of ServerInfo objects
		if(exc.key == "ServerList") {
			updateServerList(exc.payload);
		} else {
			console.log("unknown key "+exc.key+" sent from GateKeeper to client");
		}
	}

	gateKeeper.connectionFunction = connectionFunction;


	// UI stuff
	var serverList = $("<div id='serverlist'></div>");
	$('body').append(serverList);

	var updateServerList = function(serverItems) {
		$('#serverlist').empty().append("Servers: <input class='refresh' type='submit' value='Refresh' /><br/>");
		// for each item, put it in the serverlist
		for(key in serverItems) {
			var s = serverItems[key];
			var button = $("<input type='submit' value='Join' class='join' />");
			button.data("ip", s.ip);
			button.data("port", s.port);
			button.data("info", s);

			$('#serverlist').append(s.name+": "+s.ip+":"+s.port+", "+s.players+"/"+s.capacity+" ").append(button).append("<br/>");
		}
	}
}


// TODO: figure out if it's worth it to have client disconnect from GK when in game
// probably is, don't want anyone in GK unless they're looking for a game, right?
var disconnectFromGateKeeper = function() {
	if(gateKeeper) {
		gateKeeper.close();
	}
}