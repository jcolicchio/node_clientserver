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

var gateKeeper;
var server;

$(document).ready(function(){

	// This is a connection to the GateKeeper
	// This stuff is probably pretty generalizable, I don't think it necessarily belongs with the custom client stuff
	// Could we split stuff up into GateKeeperClient.js and Client.js?

	gateKeeper = new WebSocket("ws://"+window.location.hostname+":"+GateKeeperInfo.clientPort);
	gateKeeper.onopen = function () {
		console.log("Connection opened");
		
		gateKeeper.connected = true;
	}
	gateKeeper.onclose = function () {
		console.log("Connection closed");
		gateKeeper.connected = false;
	}
	gateKeeper.onerror = function () {
		console.error("Connection error");
	}
	gateKeeper.onmessage = function (event) {

		var exc = ServerExchange.import(event.data);
		// theoretically, it should just work for us
		// by virtue of importing GateKeeperInfo, the registration should be done

		//if the key is ServerList, expect a list of ServerInfo objects

		// for each item, put it in the serverlist
		$('#serverlist').empty().append("Servers: <input id='refresh' type='submit' value='Refresh' /><br/>");
		for(key in exc.payload) {
			var s = exc.payload[key];
			var button = $("<input type='submit' value='Join' class='join' />");
			button.data("ip", s.ip);
			button.data("port", s.port);

			$('#serverlist').append(s.name+": "+s.ip+":"+s.port+", "+s.players+"/"+s.capacity+" ").append(button).append("<br/>");
		}
	}

	$('body').on('click', '#refresh', function(e){
		//ask the gatekeeper connection to refresh
		gateKeeper.send(JSON.stringify(ServerExchange.new("ServerList", null)));
	});

	$('body').on('click', '.join', function(e){
		// e is what we clicked on i guess?
		var server = $(this).data("ip")+":"+$(this).data("port");
		//make connection connect to it!

		server = new WebSocket("ws://"+window.location.hostname+":"+GateKeeperInfo.clientPort);
		server.onopen = function () {
			console.log("Connection to server opened");

			server.send(JSON.stringify(ServerExchange.new("hi", null)));
			
			server.connected = true;
		}
		server.onclose = function () {
			console.log("Connection closed");
			server.connected = false;
		}
		server.onerror = function () {
			console.error("Connection error");
		}
		server.onmessage = function (event) {

		}
	});


});
