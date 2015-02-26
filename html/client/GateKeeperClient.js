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

// TODO: have callback merely pass list back to user
// TODO: create method that takes a list and generates a jquery element to add anywhere that's the list
// but with actions to connect, etc all taken care of

var GateKeeperInfo = this['GateKeeperInfo'];
var ServerInfo = this['ServerInfo'];
var ServerExchange = this['ServerExchange'];

var gateKeeper;
var connectionFunction = null;
var servers = [];

var connectToGateKeeper = function(connectionFunction, type){

	gateKeeper = new WebSocket("ws://"+window.location.hostname+":"+GateKeeperInfo.clientPort);
	gateKeeper.onopen = function () {
		console.log("Connection to GK opened");
		
		gateKeeper.connected = true;
	}
	gateKeeper.onclose = function () {
		console.log("Connection to GK closed");
		gateKeeper.connected = false;

		//gateKeeper = null;
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
			updateServerList(exc.payload, type);
		} else {
			console.log("unknown key "+exc.key+" sent from GateKeeper to client");
		}
	}

	gateKeeper.connectionFunction = connectionFunction;


	// UI stuff
	var serverList = $("<div id='serverlist'></div>");
	$('body').append(serverList);

	var updateServerList = function(serverItems, type) {
		servers = serverItems;

		var refresh = $("<input class='refresh' type='submit' value='Refresh' />");
		refresh.on('click', function(e) {
			gateKeeper.send(JSON.stringify(ServerExchange.new("ServerList", null)));
		});

		$('#serverlist').empty().append("Servers: ").append(refresh).append("<br/>");
		// for each item, put it in the serverlist
		for(key in serverItems) {
			if(!type || serverItems[key].type == type) {
				var s = serverItems[key];
				var button = $("<input type='submit' value='Join' class='join' />");
				button.data("ip", s.ip);
				button.data("port", s.port);
				button.data("info", s);

				button.on('click', function(e) {
					var server = $(this).data("ip")+":"+$(this).data("port");
					gateKeeper.connectionFunction($(this).data("info"));
				});

				$('#serverlist').append(s.name+": "+s.ip+":"+s.port+", "+s.players+"/"+s.capacity+" ").append(button).append("<br/>");
			}
		}
	}
}


// TODO: figure out if it's worth it to have client disconnect from GK when in game
// probably is, don't want anyone in GK unless they're looking for a game, right?
var disconnectFromGateKeeper = function() {
	if(gateKeeper) {
		gateKeeper.close();
		$('#serverlist').remove();
	}
}
