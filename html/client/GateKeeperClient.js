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

var GateKeeperClient = function() {
	var gk = {
		servers: [],
		onServerListReceived: null, // method accepting a list of servers,
		connectToServer: null, // method called when you click a server with the UI
		typeFilter: null,
		connected: false,
		// TODO: some sort of flag that says "yes, automatically update me as new servers update/roll in"
		private: {
			socket: null
		},
		connect: function() {
			this.private.socket = new WebSocket("ws://"+window.location.hostname+":"+GateKeeperInfo.clientPort);
			this.private.socket.onopen = function() {
				console.log("Connection to GK opened");
				gk.connected = true;
			}
			this.private.socket.onclose = function() {
				console.log("Connection to GK closed");
				gk.connected = false;
			}
			this.private.socket.onerror = function() {
				console.error("Connection error");
			}
			this.private.socket.onmessage = function(event) {
				var exc = ServerExchange.import(event.data);

				if(exc.key == "ServerList") {
					gk.servers = exc.payload;
					if(gk.onServerListReceived) {
						gk.onServerListReceived(gk.servers);
					}
				} else {
					console.log("unknown key "+exc.key+" sent from GateKeeper to client");
				}
			}
		},
		disconnect: function() {
			// disconnect from the socket
			this.private.socket.close();
		},
		generateServerListElements: function(serverItems) {
			var serverList = $("<div id='serverlist'></div>");

			var refresh = $("<input class='refresh' type='submit' value='Refresh' />");
			refresh.on('click', function(e) {
				gk.send(JSON.stringify(ServerExchange.new("ServerList", null)));
				// TODO: disable the refresh, and continually update some UI element or give callbacks or something
				// when we receive a "done refreshing", consider re-enabling?
				// this is all getting into non-standard territory
				// TODO: figure out some kind of way a server can get a stream of live servers like how TF2 do
				// and if we could define some kind of callback a player can set
				// or better yet, have serverList update itself as servers show up, that'd be sweet
			});

			serverList.append("Servers: ").append(refresh).append("<br/>");

			for(key in serverItems) {
				if(!gk.typeFilter || serverItems[key].type == gk.typeFilter) {
					var s = serverItems[key];
					var button = $("<input type='submit' value='Join' class='join' />");
					button.data("info", s);

					button.on('click', function(e) {
						if(gk.connectToServer) {
							gk.connectToServer($(this).data("info"));
						}
					});

					serverList.append(s.name+": "+s.ip+":"+s.port+", "+s.players+"/"+s.capacity+" ").append(button).append("<br/>");
				}
			}

			return serverList;
		}
	}

	return gk;
}

